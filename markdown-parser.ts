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

  // tracking if a list is being written
  let ol = false;
  let ul = false;

  // using basic md syntax from https://www.markdownguide.org/basic-syntax/
  for await (let line of lineReader) {
    // skip empty lines
    if (line.length === 0) {
      continue;
    }
    let trimmedLine = line.trim();
    // check if not a list and add closing tags if previous line was a list
    if (ol && !Number.isInteger(parseInt(trimmedLine[0]))) {
      output.push("</ol>");
      ol = false;
    } else if (ul && !["-", "*", "+"].includes(trimmedLine[0])) {
      output.push("</ul>")
      ul = false;
    }

    // check for links
    let i = 0;
    while (i < line.length) {
      // find opening [
      if (line[i] === "[") {
        // start looking for closing ]
        let j = i+1 
        while (j < line.length) {
          if (line[j] === "]") {
            // next character must be (
            if (line[j+1] === "(") {
              // look for closing )
              let k = j+2
              while (k < line.length) {
                if (line[k] === ")") {
                  console.log(i,j,k)
                  console.log(line.slice(i,j+1))
                  console.log(line.slice(j+1,k+1))
                  line = `${line.slice(0,i)}<a href=${line.slice(j+2,k)}>${line.slice(i+1,j)}</a>${line.slice(k+1)}`
                  console.log(line)
                  break
                }
                k++
              }
            }
          }
          j++
        }
      }
      i++
    }

    // check for emphasis
    i = 0;
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
              line = `${line.slice(0, i)}<em>${line.slice(
                i + 1,
                j
              )}</em>${line.slice(j + 1)}`;
              break;
            }
            j++;
          }
        }
      }
      i++;
    }

    // reset trimmed line after links and emphasis added
    trimmedLine = line.trim();

    // heading 1-6
    if (trimmedLine[0] === "#") {
      const headingArray: Array<string> = trimmedLine.split(" ");
      const headingLevel: number = headingArray[0].length;
      if (headingLevel > 6) {
        console.error(
          `Invalid md. Tried to pass as heading, only supports up to h6: ${line}`
        );
        continue;
      } else {
        const headingText: string = headingArray.slice(1).join(" ");
        output.push(`<h${headingLevel}>${headingText}</h${headingLevel}>`);
        continue;
      }
    }

    // ordered lists
    if (Number.isInteger(parseInt(trimmedLine[0]))) {
      let i = 1;
      let liFound = false;
      while (i < trimmedLine.length) {
        if (
          trimmedLine[i] === "." &&
          (trimmedLine[i + 1] === " " || trimmedLine[i + 1] === undefined)
        ) {
          if (!ol) {
            output.push("<ol>");
            ol = true;
          }
          output.push(`<li>${trimmedLine.slice(i + 2)}</li>`);
          liFound = true;
          break;
        } else if (Number.isInteger(parseInt(trimmedLine[i]))) {
          i++;
          continue;
        } else {
          break;
        }
      }
      if (liFound) {
        continue;
      }
    }

    // un-ordered lists
    if (["-", "*", "+"].includes(trimmedLine[0])) {
      if (trimmedLine[1] === " " || trimmedLine[1] === undefined) {
        if (!ul) {
          output.push("<ul>")
          ul = true
        }
        output.push(`<li>${trimmedLine.slice(2)}</li>`)
        continue;
      }
    }

    // If no other conditions are met then write as paragraph
    output.push(`<p>${trimmedLine}</p>`);

  }
  // add closing ordered list tag if the list goes until end of file
  if (ol) {
    output.push("</ol>");
  }
  // add closing un-ordered list tag if the list goes until end of file
  if (ul) {
    output.push("</ul>");
  }
  return output.join("\n");
};

const writer = async (html: string): Promise<void> => {
  fs.writeFile("./output/output.html", template(html), (err) => {
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
