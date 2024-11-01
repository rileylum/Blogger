import * as fs from 'node:fs';
import * as readline from 'readline'

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
`
}

const parser = async (file: string): Promise<string> => {
    const fileStream = fs.createReadStream(file)
    const lineReader = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })
    let output: Array<string> = [];
    for await (const line of lineReader) {
        if (line.trim()[0] === "#") {
            const headingArray: Array<string> = line.trim().split(" ")
            console.log(headingArray)
            const headingLevel: number = headingArray[0].length;
            const headingText: string = headingArray.slice(1).join(" ");
            console.log(`<h${headingLevel}>${headingText}</h${headingLevel}>`)
            output.push(`<h${headingLevel}>${headingText}</h${headingLevel}>`)
        } else {
            output.push(`<p>${line}</p>`)
        }
    }
    return output.join("\n")
}

const writer = async(html: string): Promise<void> => {
    fs.writeFile('./output.html', template(html), err => {
        if (err) {
            console.log(err)
        } else {
            console.log('file written')
        }
    })
}

const generateHtmlFromMd = async (file: string): Promise<void> => {
    const parsedMd = await parser(file)
    writer(parsedMd)
}

generateHtmlFromMd('./test.md')

