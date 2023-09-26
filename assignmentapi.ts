import axios from "axios";
import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";

const port = 7001;

interface IMessage {
  message: string;
  success: boolean;
  data: null | {} | {}[];
}

const server = http.createServer((req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
  res.setHeader("Content-type", "application/json");

  let { method, url } = req;
  let status = 404;

  let response: IMessage = {
    message: "Failed",
    success: false,
    data: null,
  };

  if (method === "GET" && url === "/fakestoreproducts") { 

    axios.get("https://fakestoreapi.com/products")
      .then(async (fakestoreendpoint) => {
        if (fakestoreendpoint.status === 200) {
          const products = fakestoreendpoint.data;
          status = 200;

          for (const product of products) {
            const imageUrl = product.image;
            const imageFileName = path.basename(imageUrl);
            const imagePath = path.join(__dirname, "Fakestore", imageFileName);

            const imageResponse = await axios.get(imageUrl, {
              responseType: "stream",
            });

            imageResponse.data.pipe(fs.createWriteStream(imagePath));
          }

          response.message = "Products fetched and images downloaded successfully";
          response.success = true;
          response.data = products;

          res.write(JSON.stringify({ status, response }));
          res.end();
        } else {
          response.message = "Failed to fetch products from the fakestoreapi.com";
          response.success = false;
          response.data = null;
          status = fakestoreendpoint.status;

          res.write(JSON.stringify({ status, response }));
          res.end();
        }
      });
  }
});

server.listen(port, () => {
  console.log("Server is running on port", port);
});
