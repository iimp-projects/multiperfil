import os
import sqlite3
import time
from s3_uploader import init_db, was_already_uploaded, record_upload

def test_monitoring_logic():
    print("--- Testing Monitoring Logic ---")
    db_name = 'test_uploader.db'
    if os.path.exists(db_name):
        os.remove(db_name)
    
    # Mock DB path for testing
    import s3_uploader
    s3_uploader.DB_PATH = db_name
    
    init_db()
    
    filename = "test_doc.pdf"
    mtime = 123456789.0
    size = 1024
    
    # 1. Should not be uploaded yet
    assert was_already_uploaded(filename, mtime, size) == False
    print("Test 1 Passed: New file detected correctly")
    
    # 2. Record upload
    record_upload(filename, mtime, size)
    
    # 3. Should be detected as already uploaded
    assert was_already_uploaded(filename, mtime, size) == True
    print("Test 2 Passed: Already uploaded file detected correctly")
    
    # 4. Modify file (change mtime)
    new_mtime = mtime + 100.0
    assert was_already_uploaded(filename, new_mtime, size) == False
    print("Test 3 Passed: Modified file (new time) detected correctly")
    
    # 5. Modify file (change size)
    new_size = size + 500
    assert was_already_uploaded(filename, mtime, new_size) == False
    print("Test 4 Passed: Modified file (new size) detected correctly")
    
    os.remove(db_name)
    print("--- All Tests Passed ---")

if __name__ == "__main__":
    test_monitoring_logic()
