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
Below lines is identical to the above code, but not in a method. 
It is slightly compressed (but certainly not optimal). It expects the canvas as C and context as X.

let h=document.documentElement.outerHTML+'<<' + 'STOP>>';let a=document.createElement('textarea');
a.innerHTML=h;h=a.value;let t='';for(let i=0;i<h.length;i++){let c=h.charCodeAt(i);if(c>255){c=32}
let b=String(c.toString(2)).padStart(8,'0');t+=b}let d=X.getImageData(0,0,C.width,C.height);let s=0;
for(let i=0;i<d.data.length;i++){if(i%4<3){let v=d.data[i];d.data[i]=v%2===parseInt(t[s])?v:v^1;s++;
if(s>t.length-1){break}}}X.putImageData(d,0,0)
*/



/*
The textarea hack used might handles some cases under the hood. 
When doing things manually, there are a few things to keep in mind

the percentage character is problematic, since it represents modulo in javascript code, but when using common
unescape methods, it will can be handled as a special character.This can be tackled by using a custom
modulo function and not use the percentage character at all.

Alternatives to get the document
new XMLSerializer().serializeToString(document)

unescape() is a handy method, but it is deprecated and should not be used
html.replace(/\\n/g, "\n") could be used, but the argument passed to replace should be
rewritten (maybe using charCodes)


Using a temporary textarea element, will handle these things under the hood, by the browsers implementation of unescaping
*/
