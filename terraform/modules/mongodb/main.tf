data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "primary" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnets[0]
  vpc_security_group_ids = [var.mongodb_sg_id]

  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail

              # Ensure we always get a log
              exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

              export DEBIAN_FRONTEND=noninteractive

              # 1. Prereqs
              apt-get update
              apt-get install -y curl gnupg xfsprogs

              # 2. Mount Data Volume
              DEVICE="/dev/sdh"
              if [ ! -b "$DEVICE" ]; then
                DEVICE="/dev/nvme1n1"
              fi

              while [ ! -b "$DEVICE" ]; do sleep 5; done

              if ! blkid "$DEVICE" >/dev/null 2>&1; then
                mkfs.xfs -f "$DEVICE"
              fi

              mkdir -p /var/lib/mongodb
              if ! mountpoint -q /var/lib/mongodb; then
                mount "$DEVICE" /var/lib/mongodb
              fi
              if ! grep -qs "^$DEVICE /var/lib/mongodb " /etc/fstab; then
                echo "$DEVICE /var/lib/mongodb xfs defaults,nofail 0 2" >> /etc/fstab
              fi

              # 3. Install MongoDB 7.0
              curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
              echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
              apt-get update
              apt-get install -y mongodb-org

              # 4. Configure MongoDB (Enabling replication for ALL envs to support Prisma transactions)
              systemctl stop mongod || true
              sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf
              if ! grep -q '^replication:' /etc/mongod.conf; then
                if grep -q '^#replication:' /etc/mongod.conf; then
                  sed -i 's/^#replication:/replication:\n  replSetName: "rs0"/' /etc/mongod.conf
                else
                  printf '\nreplication:\n  replSetName: "rs0"\n' >> /etc/mongod.conf
                fi
              fi

              if id mongodb >/dev/null 2>&1; then
                chown -R mongodb:mongodb /var/lib/mongodb
                chmod 700 /var/lib/mongodb
              fi

              systemctl enable mongod
              systemctl start mongod

              # 5. Initialize Replica Set and create app user
              for i in {1..60}; do
                if mongosh --quiet --eval "db.adminCommand({ping:1}).ok" >/dev/null 2>&1; then
                  break
                fi
                sleep 2
              done

              PRIVATE_IP=$(hostname -I | awk '{print $1}')

              RS_OK=$(mongosh --quiet --eval "try{print(rs.status().ok)}catch(e){print(0)}" || true)
              if [ "$RS_OK" != "1" ]; then
                mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'$${PRIVATE_IP}:27017'}]})"
              fi

              %{if var.environment == "prod"~}
              # Add secondary and arbiter once they respond.
              for i in {1..90}; do
                if mongosh --host "${aws_instance.secondary[0].private_ip}:27017" --quiet --eval "db.adminCommand({ping:1}).ok" >/dev/null 2>&1; then
                  break
                fi
                sleep 2
              done
              mongosh --quiet --eval "try{rs.add('${aws_instance.secondary[0].private_ip}:27017')}catch(e){print(e)}" || true

              for i in {1..90}; do
                if mongosh --host "${aws_instance.arbiter[0].private_ip}:27017" --quiet --eval "db.adminCommand({ping:1}).ok" >/dev/null 2>&1; then
                  break
                fi
                sleep 2
              done
              mongosh --quiet --eval "try{rs.addArb('${aws_instance.arbiter[0].private_ip}:27017')}catch(e){print(e)}" || true
              %{endif~}

              mongosh multiperfil --quiet --eval "db.getUser('${var.db_user}') || db.createUser({user: '${var.db_user}', pwd: '${var.db_pass}', roles: [{role: 'readWrite', db: 'multiperfil'}]})"
              EOF

  tags = {
    Name   = "${var.project_name}-${var.environment}-mongodb-primary"
    Role   = "Primary"
    Backup = "true"
  }
}

resource "aws_ebs_volume" "primary_data" {
  availability_zone = aws_instance.primary.availability_zone
  size              = 20
  type              = "gp3"
  encrypted         = true

  tags = {
    Name   = "${var.project_name}-${var.environment}-mongodb-primary-data"
    Backup = "true"
  }
}

resource "aws_volume_attachment" "primary_attach" {
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.primary_data.id
  instance_id = aws_instance.primary.id
}

resource "aws_instance" "secondary" {
  count                  = var.environment == "prod" ? 1 : 0
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnets[1]
  vpc_security_group_ids = [var.mongodb_sg_id]

  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail
              exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
              export DEBIAN_FRONTEND=noninteractive

              apt-get update
              apt-get install -y curl gnupg xfsprogs

              # 1. Mount Data Volume
              DEVICE="/dev/sdh"
              if [ ! -b "$DEVICE" ]; then
                DEVICE="/dev/nvme1n1"
              fi
              while [ ! -b "$DEVICE" ]; do sleep 5; done

              if ! blkid "$DEVICE" >/dev/null 2>&1; then
                mkfs.xfs -f "$DEVICE"
              fi

              mkdir -p /var/lib/mongodb
              if ! mountpoint -q /var/lib/mongodb; then
                mount "$DEVICE" /var/lib/mongodb
              fi
              if ! grep -qs "^$DEVICE /var/lib/mongodb " /etc/fstab; then
                echo "$DEVICE /var/lib/mongodb xfs defaults,nofail 0 2" >> /etc/fstab
              fi

              # 2. Install MongoDB 7.0
              curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
              echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
              apt-get update
              apt-get install -y mongodb-org

              # 3. Configure MongoDB
              systemctl stop mongod || true
              sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf
              if ! grep -q '^replication:' /etc/mongod.conf; then
                if grep -q '^#replication:' /etc/mongod.conf; then
                  sed -i 's/^#replication:/replication:\n  replSetName: "rs0"/' /etc/mongod.conf
                else
                  printf '\nreplication:\n  replSetName: "rs0"\n' >> /etc/mongod.conf
                fi
              fi

              if id mongodb >/dev/null 2>&1; then
                chown -R mongodb:mongodb /var/lib/mongodb
                chmod 700 /var/lib/mongodb
              fi

              systemctl enable mongod
              systemctl start mongod
              EOF

  tags = {
    Name   = "${var.project_name}-${var.environment}-mongodb-secondary"
    Role   = "Secondary"
    Backup = "true"
  }
}

resource "aws_ebs_volume" "secondary_data" {
  count             = var.environment == "prod" ? 1 : 0
  availability_zone = aws_instance.secondary[0].availability_zone
  size              = 20
  type              = "gp3"
  encrypted         = true

  tags = {
    Name   = "${var.project_name}-${var.environment}-mongodb-secondary-data"
    Backup = "true"
  }
}

resource "aws_volume_attachment" "secondary_attach" {
  count       = var.environment == "prod" ? 1 : 0
  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.secondary_data[0].id
  instance_id = aws_instance.secondary[0].id
}

resource "aws_instance" "arbiter" {
  count                  = var.environment == "prod" ? 1 : 0
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.nano"
  subnet_id              = var.private_subnets[0]
  vpc_security_group_ids = [var.mongodb_sg_id]

  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail
              exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
              export DEBIAN_FRONTEND=noninteractive

              # Install MongoDB 7.0
              apt-get update
              apt-get install -y curl gnupg
              curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
              echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
              apt-get update
              apt-get install -y mongodb-org

              # Configure MongoDB
              systemctl stop mongod || true
              sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf
              if ! grep -q '^replication:' /etc/mongod.conf; then
                if grep -q '^#replication:' /etc/mongod.conf; then
                  sed -i 's/^#replication:/replication:\n  replSetName: "rs0"/' /etc/mongod.conf
                else
                  printf '\nreplication:\n  replSetName: "rs0"\n' >> /etc/mongod.conf
                fi
              fi

              systemctl enable mongod
              systemctl start mongod
              EOF

  tags = {
    Name = "${var.project_name}-${var.environment}-mongodb-arbiter"
    Role = "Arbiter"
  }
}

output "primary_private_ip" {
  value = aws_instance.primary.private_ip
}

output "secondary_private_ip" {
  value = length(aws_instance.secondary) > 0 ? aws_instance.secondary[0].private_ip : null
}

output "arbiter_private_ip" {
  value = length(aws_instance.arbiter) > 0 ? aws_instance.arbiter[0].private_ip : null
}
