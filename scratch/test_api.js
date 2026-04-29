
import axios from 'axios';

async function test() {
  const apiDomain = "https://secure2.iimp.org:8443";
  const apiBasePath = "/KBServiciosPruebaIIMPJavaEnvironment/rest";
  const apiKey = "NqP4ymWMM6Qyovruc6qEL4xBsyvnHJekQI4Xjwp3XRpcW3qSRxSMeUfChPdi8iYK";
  const event = "WMC26";

  const apiUrl = `${apiDomain}${apiBasePath}/siecodelist`;

  try {
    const response = await axios.post(apiUrl, { event }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      }
    });

    if (response.data && response.data.siecodelist) {
      console.log(`Total users in ${event}: ${response.data.siecodelist.length}`);
      console.log("Sample users:");
      console.log(JSON.stringify(response.data.siecodelist.slice(0, 5), null, 2));
    } else {
      console.log("No siecodelist in response");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
