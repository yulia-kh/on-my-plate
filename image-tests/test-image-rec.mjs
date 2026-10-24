import OpenAI from "openai";
import fs from "node:fs";

const client = new OpenAI();

const image = fs.readFileSync("chicken-rice.jpg");
const base64 = image.toString("base64");

const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Identify the foods visible in this image.
Return only JSON in this format:
{"foods":["Food 1","Food 2"]}.
Do not guess hidden ingredients.
Do not estimate carbohydrates or insulin doses.`,
        },
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${base64}`,
          detail: "low",
        },
      ],
    },
  ],
});

console.log(response.output_text);
