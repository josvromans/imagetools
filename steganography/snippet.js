/*
This snippet can be used in an html document that generates an artwork.
After the artwork is rendered in the canvas, 'onDone()' can be called, and it will update the canvas' image data
to embed the content of entire html page.

This can behave different for different browsers and versions.
More notes on bottom of file.
*/
convertTextToBinary=text=>{
    let binary = '';
    for (let i=0; i<text.length; i++){
        let charCode = text.charCodeAt(i);
        if (charCode>255){
            console.error(text[i], ' has a charCode outside the range 0-255, it has been replaced by a space')
            charCode = 32;  // default to space
        }
        let binaryString = String(charCode.toString(2)).padStart(8, '0')
        binary += binaryString;
    }
    return binary;
}

onDone=(canvas, ctx)=>{
	/*
	Call this when drawing the artwork on the canvas is done.

	This method will manipulate the image data on the canvas.
	It will use the content of the entire current HTML document, and embed it into the image least significant bit.

	So in case it is a standalone html document containing the JavaScript to draw an artwork,
	it means that the entire code to draw the image will be embedded in the image data.
	*/
	let html = document.documentElement.outerHTML + '<<' + 'STOP>>';  // this stop identifier is optional, but it is used by the other page in this repository

    // this is a hack to unescape the text by. See notes on bottom of this file
    const _textArea = document.createElement('textarea');
    _textArea.innerHTML = html;
    html = _textArea.value;

	let targetBinaryString = convertTextToBinary(html)
	console.log(targetBinaryString)

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let stringIndex=0;
    for (let i = 0; i < imgData.data.length; i++) {
        if (i%4===3){continue}  // leave alpha value unchanged by not updating the imgData.data
        
        let v = imgData.data[i];  // current image value
        let target = targetBinaryString[stringIndex]  // targetBinary
        imgData.data[i] = v%2 === parseInt(target)?v:v^1;
        stringIndex ++;
        if (stringIndex > targetBinaryString.length-1){break}
    }
    ctx.putImageData(imgData, 0, 0);
}


/*
Alternatives to get the document
new XMLSerializer().serializeToString(document)


unescape() is a handy method, but it is deprecated and should not be used
.replace() could be used, but the characters
text.replace(/\\n/g, "\n")  could be used, but make sure to not put that first argument like that, you could construct it by useing charcodes
I think it can work, but the textarea hack might handle more cases under the hood that are convenient (?)


the percentage character is problematic, since it represents modulo in javascript, but when using common
unescape methods, it will be handled as a special character. So whenever you go that way, you want to use a custom
modulo method in your code to avoid using the percentage character.

Using a temporary textarea element, will handle these things under the hood, by the browsers implementation of unescaping
*/

