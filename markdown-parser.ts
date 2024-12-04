import fs = require("node:fs");
import readline = require("node:readline");
import path = require("node:path");

enum MetadataReadStatus {
  NotStarted = 0,
  Started = 1,
  Finished = 2,
}

enum GenericReadStatus {
  NotStarted = 0,
  Started = 1,
}

interface Metadata {
  title: string;
  publishDate: Date;
  blurb: string;
}

interface ParsedMd {
  htmlString: string;
  metadata: Metadata;
}

const readMetadata = (
  line: string,
  metadata: Metadata,
  metadataStatus: MetadataReadStatus,
  blurbStatus: GenericReadStatus
): [Metadata, MetadataReadStatus, GenericReadStatus] => {
  // FIND START OF METADATA IF NOT ALREADY STARTED/FINISHED
  let newMetadata = metadata;
  let newBlurbStatus = blurbStatus;
  if (metadataStatus === MetadataReadStatus.NotStarted) {
    if (line === "```") {
      return [newMetadata, MetadataReadStatus.Started, newBlurbStatus];
    }
  } else if (metadataStatus === MetadataReadStatus.Started) {
    if (line === "```") {
      return [newMetadata, MetadataReadStatus.Finished, newBlurbStatus];
    } else {
      let [key, value] = line.split(":");
      if (!value) {
        return [newMetadata, MetadataReadStatus.Started, newBlurbStatus];
      }
      if (key === "title") {
        newMetadata["title"] = value.trim();
      } else if (key === "publishDate") {
        newMetadata["publishDate"] = new Date(value);
      } else if (
        key === "blurb" &&
        newBlurbStatus.valueOf() === GenericReadStatus.NotStarted
      ) {
        newMetadata["blurb"] = value.trim();
        newBlurbStatus = GenericReadStatus.Started;
      } else {
        console.warn(`Unrecognised Metadata Tag: {${key}: ${value.trim()}}`);
      }
      return [newMetadata, MetadataReadStatus.Started, newBlurbStatus];
    }
  }
  return [newMetadata, MetadataReadStatus.NotStarted, newBlurbStatus];
};

const checkEndOrderedList = (
  line: string,
  output: Array<string>
): [Array<string>, GenericReadStatus] => {
  // IF THE NEXT LINE DOESN'T START WITH AN INTEGER THEN THE ORDERED LIST MUST BE FINISHED
  const trimmedLine = line.trim();
  if (trimmedLine[0] && !Number.isInteger(parseInt(trimmedLine[0]))) {
    const newOutput = [...output, "</ol>"];
    return [newOutput, GenericReadStatus.NotStarted];
  } else {
    return [output, GenericReadStatus.Started];
  }
};

const checkEndUnOrderedList = (
  line: string,
  output: Array<string>
): [Array<string>, GenericReadStatus] => {
  // IF THE NEXT LINE DOESN'T START WITH A VALID LIST CHARACTER
  const trimmedLine = line.trim();
  if (trimmedLine[0] && !["-", "+"].includes(trimmedLine[0])) {
    const newOutput = [...output, "</ul>"];
    return [newOutput, GenericReadStatus.NotStarted];
  } else {
    return [output, GenericReadStatus.Started];
  }
};

const replaceLinksImages = (line: string): string => {
  let newLine = line;
  let i = 0;
  while (i < newLine.length) {
    // FIND OPENING [
    if (newLine[i] === "[") {
      let j = i + 1;
      while (j < newLine.length) {
        // FIND CLOSING ]
        if (newLine[j] === "]") {
          // NEXT CHARACTER MUST BE (
          if (newLine[j + 1] === "(") {
            let k = j + 2;
            while (k < newLine.length) {
              // FIND CLOSING )
              if (newLine[k] === ")") {
                // IF STARTS WITH ! THEN IT IS AN IMAGE
                if (newLine[i - 1] === "!") {
                  const src = `${newLine.slice(j + 5, k)}`
                  const dst = path.join(config.outputDir, `${newLine.slice(j + 4, k)}`)
                  newLine = `${newLine.slice(
                    0,
                    i - 1
                  )}<img src='${newLine.slice(j + 2, k)}' ${newLine.slice(k+2,-1)} alt='${newLine.slice(
                    i + 1,
                    j
                  )}'>${newLine.slice(k + 1)}`;
                  fs.copyFile(src,dst, (err) => {
                    if (err) {
                      console.error("failed to move image", err)
                    }
                  })
                } else {
                  // ELSE IT IS A LINK
                  newLine = `${newLine.slice(0, i)}<a href='${newLine.slice(
                    j + 2,
                    k
                  )}'>${newLine.slice(i + 1, j)}</a>${newLine.slice(k + 1)}`;
                }
                // ADVANCED THE POINTER TO CONTINUE SEARCHING FROM THE END OF THIS LINK
                i = k;
                // FINISH THE INNER LOOPS
                j = newLine.length;
                k = newLine.length;
              }
              k++;
            }
          }
        }
        j++;
      }
    }
    i++;
  }
  return newLine;
};

const replaceEmphasis = (line: string): string => {
  let newLine = line;

  // START LOOKING FOR BOLD
  let i = 0;
  while (i < newLine.length) {
    if (newLine.slice(i, i + 2) === "**" && newLine[i + 2] !== " ") {
      let j = i + 3;
      while (j < newLine.length) {
        if (
          newLine.slice(j, j + 2) === "**" &&
          newLine[j - 1] !== " " &&
          newLine[j + 2] !== "*"
        ) {
          newLine = `${newLine.slice(0, i)}<strong>${newLine.slice(
            i + 2,
            j
          )}</strong>${newLine.slice(j + 2)}`;
          // break out of the inner loop, start searching the rest of line
          i = j + 2;
          break;
        }
        j++;
      }
    }
    i++;
  }
  // START LOOKING FOR ITALIC
  i = 0;
  while (i < newLine.length) {
    if (newLine[i] === "*" && newLine[i + 1] !== " ") {
      let j = i + 2;
      while (j < newLine.length) {
        if (newLine[j] === "*" && newLine[j - 1] !== " ") {
          newLine = `${newLine.slice(0, i)}<em>${newLine.slice(
            i + 1,
            j
          )}</em>${newLine.slice(j + 1)}`;
          // break out of the inner loop, start searching the rest of line
          i = j + 1;
          break;
        }
        j++;
      }
    }
    i++;
  }
  return newLine;
};

const replaceQuotes = (line: string): string => {
  let newLine = line;
  let i = 0;
  while (i < newLine.length) {
    if (newLine[i] === '"') {
      let j = i + 1;
      while (j < newLine.length) {
        if (newLine[j] === '"') {
          newLine = `${newLine.slice(0, i)}&ldquo;${newLine.slice(
            i + 1,
            j
          )}&rdquo;${newLine.slice(j + 1)}`;
          // move i up to end of quote, finish j loop
          i = j + 1;
          j = newLine.length;
        }
        j++;
      }
    }
    i++;
  }
  return newLine;
};

const replaceCode = (line: string): string => {
  let newLine = line;
  let i = 0;
  while (i < newLine.length) {
    if (newLine.slice(i, i + 2) === "``") {
      let j = i + 2;
      while (j < newLine.length) {
        if (newLine.slice(j, j + 2) === "``") {
          newLine = `${newLine.slice(0, i)}<code>${newLine.slice(
            i + 2,
            j
          )}</code>${newLine.slice(j + 2)}`;
          i = j + 2;
          j = newLine.length;
        }
        j++;
      }
    }
    i++;
  }
  return newLine;
};

const createHeadings = (line: string): string | null => {
  const headingSplit = line.trim().split(" ");
  const headingRegex = new RegExp("[^#]");
  // CHECK IF IT ONLY CONTAINS #'s
  if (headingSplit[0] && !headingRegex.test(headingSplit[0])) {
    let headingLevel = headingSplit[0].length;
    const headingText = headingSplit.slice(1).join(" ");
    if (headingLevel > 6) {
      console.warn(
        `Max heading level exceeded, only supports up to h6: ${line}`
      );
      headingLevel = 6;
    }
    return `<h${headingLevel}>${headingText}</h${headingLevel}>`;
  } else {
    console.error(`Detected heading, but #'s aren't correct: ${line}`);
    return null;
  }
};

const createOrderedList = (
  line: string,
  olStatus: GenericReadStatus
): [string[], GenericReadStatus] => {
  const output: string[] = [];
  const listRegex = new RegExp("[0-9]*");
  const match = line.match(listRegex);
  if (
    match &&
    Number.isInteger(parseInt(match[0])) &&
    match.index === 0 &&
    line.slice(match[0].length, match[0].length + 2).trim() === "."
  ) {
    if (olStatus.valueOf() === GenericReadStatus.NotStarted) {
      output.push("<ol>");
      output.push(`<li>${line.trim().slice(3)}</li>`);
      return [output, GenericReadStatus.Started];
    } else {
      output.push(`<li>${line.trim().slice(3)}</li>`);
      return [output, olStatus];
    }
  }
  return [output, olStatus];
};

const createUnorderedList = (
  line: string,
  ulStatus: GenericReadStatus
): [string[], GenericReadStatus] => {
  let output: string[] = [];
  if (ulStatus.valueOf() === GenericReadStatus.NotStarted) {
    output.push("<ul>");
    output.push(`<li>${line.slice(2)}</li>`);
    return [output, GenericReadStatus.Started];
  } else {
    output.push(`<li>${line.slice(2)}</li>`);
    return [output, ulStatus];
  }
};

const createHtmlTags = (
  line: string,
  output: string[],
  olStatus: GenericReadStatus,
  ulStatus: GenericReadStatus,
  codeStatus: GenericReadStatus
): [string[], GenericReadStatus, GenericReadStatus, GenericReadStatus] => {
  let newOutput = [...output];
  const firstChar = line.trim()[0];
  // Headings
  if (firstChar === "#") {
    const headingOutput = createHeadings(line);
    if (headingOutput) {
      newOutput.push(headingOutput);
      return [newOutput, olStatus, ulStatus, codeStatus];
    }
  }
  // Ordered Lists
  if (firstChar && Number.isInteger(parseInt(firstChar))) {
    const listOutput = createOrderedList(line.trim(), olStatus);
    if (listOutput[0].length > 0) {
      newOutput.push(...listOutput[0]);
      return [newOutput, listOutput[1], ulStatus, codeStatus];
    }
  }
  // Unordered Lists
  if (
    firstChar &&
    ["-", "+"].includes(firstChar) &&
    (line.trim()[1] === " " || line.trim()[1] === undefined)
  ) {
    const listOutput = createUnorderedList(line.trim(), ulStatus);
    if (listOutput[0].length > 0) {
      newOutput.push(...listOutput[0]);
      return [newOutput, olStatus, listOutput[1], codeStatus];
    }
  }
  if (firstChar === "<") {
    if (
      line.trim().slice(0, 6) === "<code>" &&
      line.trim().slice(-7) === "</code>"
    ) {
      newOutput.push("<pre>" + line.trim() + "</pre>");
      return [newOutput, olStatus, ulStatus, codeStatus];
    } else if (
      line.trim().slice(0,4) === "<img" &&
      line.trim().slice(-1) === ">"
    ) {
      newOutput.push(line.trim())
      return [newOutput, olStatus, ulStatus, codeStatus];
    }
  }
  if (firstChar === ">") {
    newOutput.push("<blockquote>" + line.slice(1).trim() + "</blockquote>");
    return [newOutput, olStatus, ulStatus, codeStatus];
  }
  // Default case, just create a paragraph
  newOutput.push(`<p>${line.trim()}</p>`);
  return [newOutput, olStatus, ulStatus, codeStatus];
};

const mdParser = async (file: string): Promise<ParsedMd> => {
  const fileStream = fs.createReadStream(file);
  const lineReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let output: Array<string> = [];

  let metadataStatus: MetadataReadStatus = MetadataReadStatus.NotStarted;
  let metadata: Metadata = {
    title: "",
    publishDate: new Date(),
    blurb: "",
  };

  let olStatus: GenericReadStatus = GenericReadStatus.NotStarted;
  let ulStatus: GenericReadStatus = GenericReadStatus.NotStarted;
  let codeStatus: GenericReadStatus = GenericReadStatus.NotStarted;
  let blurbStatus: GenericReadStatus = GenericReadStatus.NotStarted;

  for await (let line of lineReader) {
    // SKIP EMPTY LINES
    if (line.length === 0) {
      continue;
    }
    // READ METADATA
    if (metadataStatus.valueOf() !== MetadataReadStatus.Finished) {
      [metadata, metadataStatus, blurbStatus] = readMetadata(
        line,
        metadata,
        metadataStatus,
        blurbStatus
      );
    } else {
      // INTERPRET THE REST AS HTML
      // CHECK IF ANY ACTIVE LISTS NEED TO BE CLOSED
      // CHECK ORDERED LIST STATUS
      if (olStatus.valueOf() === GenericReadStatus.Started) {
        [output, olStatus] = checkEndOrderedList(line, output);
      }
      // CHECK UNORDERED LIST STATUS
      if (ulStatus.valueOf() === GenericReadStatus.Started) {
        [output, ulStatus] = checkEndUnOrderedList(line, output);
      }

      // DO ALL INLINE REPLACEMENTS
      line = replaceCode(
        replaceQuotes(replaceEmphasis(replaceLinksImages(line)))
      );
      [output, olStatus, ulStatus] = createHtmlTags(
        line,
        output,
        olStatus,
        ulStatus,
        codeStatus
      );
    }
  }

  // Close any outstanding lists
  // TODO: Probably need to handle the order here...
  if (olStatus.valueOf() === GenericReadStatus.Started) {
    output.push("</ol>");
  }
  if (ulStatus.valueOf() === GenericReadStatus.Started) {
    output.push("</il>");
  }
  // If blurb didn't exist in metadata, then use the first line after presumably the title (i.e. second line)
  if (
    blurbStatus.valueOf() === GenericReadStatus.NotStarted &&
    output[1] &&
    output[2] &&
    output[3]
  ) {
    metadata["blurb"] =
      output[1] +
      output[2] +
      output[3] +
      "<span style='line-height: 2rem'><em>Continue Reading...</em></span>";
    metadata["blurb"] = metadata["blurb"]
      .replaceAll("h3", "h4")
      .replaceAll("h2", "h3")
      .replaceAll("h1", "h2");
  }

  return {
    htmlString: output.join("\n"),
    metadata: metadata,
  };
};

const postCardTemplate = (post: ParsedMd): string => {
  const date = post.metadata.publishDate;
  const formattedDate = date.toLocaleDateString("en-gb", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const readTime = Math.round(
    post.htmlString.replaceAll("\n", " ").split(" ").length / 200
  ).toString();
  return `<a href="posts/${post.metadata.title.toLowerCase().replaceAll(" ", "-")}.html" style="all:unset; cursor:pointer;"><div style="margin-bottom:2rem;">
    <h2>${post.metadata.title}</h2>
    <div style="display: flex; column-gap: 1em"><span><em>${formattedDate}</em></span><span><em>${readTime} min read</em></span></div>
    ${post.metadata.blurb}
  </div></a><hr>`;
};

const homeTemplate = (posts: ParsedMd[]): string => {
  const css = fs.readFileSync(config.cssFile, "utf8");
  const body = posts.map((post) => {
    if (post.metadata.publishDate > new Date(Date.now())) {
      console.log(`Skipping post ${post.metadata.title}, as it isn't published yet.`)
      return ""
    } else {
      return postCardTemplate(post)
    }
  }).join("");
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="content-type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <meta name="author" content="">
      <meta name="description" content="">
      <meta name="keywords" content="">
      <title>Diegetic Advancement Blog</title>
  
      <style>
      ${css}
      </style>
  </head>
  <body>
  <h1>Diegetic Advancement Blog</h1>
  <hr>
  ${body}
  </body>
  </html>`;
};

const writeHomeHtml = async (posts: ParsedMd[]): Promise<void> => {
  fs.writeFile(
    path.join(config.outputDir, "index.html"),
    homeTemplate(posts),
    (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`File written: ${config.outputDir}/index.html`);
      }
    }
  );
};

const htmlTemplate = (data: ParsedMd): string => {
  const css = fs.readFileSync(config.cssFile, "utf8");
  const title = data.metadata.title;
  const body = data.htmlString;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="author" content="">
    <meta name="description" content="">
    <meta name="keywords" content="">
    <title>${title} - Diegetic Advancement Blog</title>

    <style>
    ${css}
    </style>
</head>
<body>
${body}
</body>
</html>`;
};

const writeHtml = async (data: ParsedMd): Promise<void> => {
  fs.writeFile(
    path.join(config.outputDir, "posts", `${data.metadata.title.toLowerCase().replaceAll(" ", "-")}.html`),
    htmlTemplate(data),
    (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(
          `File written: ${
            config.outputDir
          }/posts/${data.metadata.title.toLowerCase().replaceAll(" ", "-")}.html`
        );
      }
    }
  );
};

const generateHtmlFromMd = async (file: string): Promise<ParsedMd> => {
  const parsedMd = await mdParser(file);
  return parsedMd;
};

const sortPosts = (postList: ParsedMd[]): ParsedMd[] => {
  const sortedPostList = postList.sort((a, b) =>
    a.metadata.publishDate > b.metadata.publishDate ? -1 : 1
  );
  return sortedPostList;
};

const generatePosts = async (): Promise<ParsedMd[]> => {
  const fileNames = fs.readdirSync(config.postDir);
  let postList: ParsedMd[] = [];
  await Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(config.postDir, fileName);
      // CHECK IF FILE IS MARKDOWN
      if (fileName.split(".").pop() === "md") {
        await generateHtmlFromMd(filePath).then((parsedMd) => {
          writeHtml(parsedMd);
          postList.push(parsedMd);
        });
      }
    })
  );
  return sortPosts(postList);
};

const config = {
  postDir: path.join(__dirname, process.env.POSTDIR ?? "posts"),
  // outputDir: path.join(__dirname, process.env.OUTDIR ?? "output"),
  outputDir: process.env.OUTDIR ?? path.join(__dirname, "output"),
  cssFile: path.join(__dirname, process.env.STYLEFILE ?? "posts/style.css"),
};

const buildSite = async (): Promise<void> => {
  const posts = await generatePosts();
  await writeHomeHtml(posts);
};

buildSite();
