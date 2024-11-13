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
embedCode=(canvas, ctx)=>{
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
saveCanvasWithCodeEmbedded=(canvas, ctx, filename)=>{
	embedCode(canvas, ctx);

    var link = document.createElement('a');
    link.setAttribute('download', filename);
    link.setAttribute('href', canvas.toDataURL('image/png'));
    link.click();
    console.log('Saved ' + filename + '.png');
}

pad0=nr=>nr.toString().padStart(2, '0');  // convert a number to a string, and prefix with 0 if its not length 2 already
getTimestamp=_=>{
    /*
    return a string in the format '20231101_1415_34123' which is always the same length (single digit numbers get prefixed with 0)
    The first 8 characters are the year,month,day,
    Followed by a '_'
    Followed by 4 characters for hours,minutes
    Followed by a '_'
    Followed by 5 characters for the seconds, milliseconds

    Note: when sorting files starting with this timestamp alphabetically, it will equal chronological order
    */
    const date = new Date();
    // below equals `${year}${month}${day}_${hour}${mins}${sec}_${millisec}`  without writing each one out as a variable
    return `${date.getFullYear()}${pad0(date.getMonth()+1)}${pad0(date.getDate())}_${pad0(date.getHours())}${pad0(date.getMinutes())}_${pad0(date.getSeconds())}${pad0(date.getMilliseconds())}`;
}

// in case your <canvas> has id C, and the ctx is X
// double clicking on the cavas will save a png with the current code embedded
C.ondblclick=_=>{
	let projectName = 'MyProject';
	let hash = 'randomHash';
	let filename = `${getTimestamp()}__${projectName}_${hash}__CODE_EMBEDDED`;
	saveCanvasWithCodeEmbedded(C,X,filename);
}