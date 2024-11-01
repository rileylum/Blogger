import * as fs from "node:fs";
import * as readline from "readline";

const template = (body) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="author" content="">
    <meta name="description" content="">
    <meta name="keywords" content="">
    <title>Document</title>

    <link rel="stylesheet" href="style.css">
</head>
<body>
${body}
</body>
</html>
`;
};

const parser = async (file: string): Promise<string> => {
  const fileStream = fs.createReadStream(file);
  const lineReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  let output: Array<string> = [];
  // using basic md syntax from https://www.markdownguide.org/basic-syntax/
  for await (let line of lineReader) {
    // check for emphasis
    let i = 0;
    while (i < line.length) {
      if (line[i] === "*") {
        if (line[i + 1] === "*") {
          if (line[i + 2] !== " ") {
            // start looking for bold
            let j = i + 3;
            while (j < line.length) {
              if (line[j] === "*") {
                if (line[j + 1] === "*") {
                  if (line[j - 1] !== " ") {
                    line = `${line.slice(0, i)}<strong>${line.slice(
                      i + 2,
                      j
                    )}</strong>${line.slice(j + 2)}`;
                    break;
                  }
                }
              }
              j++;
            }
          }
        } else if (line[i + 1] !== " ") {
          // start looking for italic
          let j = i + 2;
          while (j < line.length) {
            if (line[j] === "*") {
              line = `${line.slice(0,i)}<em>${line.slice(i+1,j)}</em>${line.slice(j+1)}`
              break;
            }
            j++;
          }
        }
      }
      i++;
    }
    // heading 1-6
    if (line.trim()[0] === "#") {
      const headingArray: Array<string> = line.trim().split(" ");
      const headingLevel: number = headingArray[0].length;
      if (headingLevel > 6) {
        console.error(
          `Invalid md. Tried to pass as heading, only supports up to h6: ${line}`
        );
      } else {
        const headingText: string = headingArray.slice(1).join(" ");
        output.push(`<h${headingLevel}>${headingText}</h${headingLevel}>`);
      }
    } else {
      output.push(`<p>${line}</p>`);
    }
  }
  return output.join("\n");
};

const writer = async (html: string): Promise<void> => {
  fs.writeFile("./output.html", template(html), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("file written");
    }
  });
};

const generateHtmlFromMd = async (file: string): Promise<void> => {
  const parsedMd = await parser(file);
  writer(parsedMd);
};

generateHtmlFromMd("./test.md");
