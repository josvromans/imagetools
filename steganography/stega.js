IMAGE = undefined;
IMAGE_DATA = {};
STOP_IDENTIFIER = '~~END~~';
X=C.getContext('2d', { 'willReadFrequently': true });
MAX_CHARACTERS_TO_READ = new URLSearchParams(window.location.search).get('max_characters') || 20000;
MAX_ITERS = parseInt(MAX_CHARACTERS_TO_READ)*8/3*4;
MAX_ITERS = (MAX_ITERS / 4|0)*4;  // round down to closest multiple of 4
var DETECTED_HTML;

addRow=(k,v)=>{
  let tr = document.createElement('tr');
  [k,v].forEach(i=>{
    let td = document.createElement('td');
    td.innerHTML = i;
    tr.appendChild(td)
  })
  document.getElementById('DATA_TABLE').appendChild(tr)
}

updateStatus=text=>document.getElementById('status').innerHTML=text;
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
    IMAGE_DATA.textLength = text.length;
    IMAGE_DATA.textOriginalLength = text.length - STOP_IDENTIFIER.length;
    IMAGE_DATA.binaryLength = binary.length;
    IMAGE_DATA.pixelsContainMessage = Math.ceil(binary.length/3);
    return binary;
}
convertBinaryToText=binary=>{
    // binary is a string like '01110101010101010101001...' and has to be chopped in substrings of length 8,
    // because only characters in 0-255 char range are expected, which have exactly length 8 each
    let text = '';
    for (let i=0; i<binary.length; i+=8){
        let substring = binary.slice(i, i+8);
        let intValue = parseInt(substring, 2);  // turns '01010101' into the integer 85
        let textChar = String.fromCharCode(intValue);
        text += textChar;
    }
    return text;
}
readImage=_=>{
    let binaryString = '';
    const imageData = X.getImageData(0, 0, C.width, C.height);
    for (let i = 0; i < imageData.data.length; i ++) {  // steps of 4 since there are 4 channels, RGB & alpha
        if (i%4===3){continue}  // ignore alpha channel
        if (i>MAX_ITERS){break}
        binaryString += imageData.data[i] % 2;  // just add 0 or 1 to the binary string
    }
    return convertBinaryToText(binaryString);
}
encryptTextIntoImage=text=>{
    let targetBinaryString = convertTextToBinary(text);
    let imgData = X.getImageData(0, 0, C.width, C.height);  // get rid of width/height?
    let stringIndex=0;

    for (let i = 0; i < imgData.data.length; i++) {  // steps of 4 since there are 4 channels, RGB & alpha
        if (i%4===3){continue}  // ignore alpha channel, leave the value in imageData untouched
            let target = parseInt(targetBinaryString[stringIndex]);
            // the target is the value in the binary string that should match with the channel value 'v'
            let v = imgData.data[i];  // current value in imagedata (a channel value 0-255)
            imgData.data[i] = v%2 === target?v:v^1;  // v^1 flips least significant bit
            stringIndex ++;  // position in target binary string, should not increment when i%4===3 (when it is the alpha channel)
        if (stringIndex > targetBinaryString.length-1){break}
    }
    X.putImageData(imgData, 0, 0);
}
encrypt=_=>{
    new Promise((resolve, reject) => {
        document.getElementById('btn-encrypt').disabled=true;
        updateStatus('Adding data to image..');
        encryptTextIntoImage(TEXTAREA.value + STOP_IDENTIFIER);
        resolve();
    })
    .then(() => {
        console.log('Adding data to image..');
    })
    .finally(() => {
        let filename = 'HIDDEN__' + IMAGE_DATA.name;
        link.setAttribute('download', filename);
        link.setAttribute('href', C.toDataURL("image/png"));
        link.click();

        addRow('Original message length', IMAGE_DATA.textOriginalLength);
        addRow('Message length', IMAGE_DATA.textLength);
        addRow('Binary length', IMAGE_DATA.binaryLength);
        addRow('Pixels containing message', IMAGE_DATA.pixelsContainMessage);
        let perc = IMAGE_DATA.pixelsContainMessage / IMAGE_DATA.totalPixels * 100;
        addRow('Image adjusted', `${perc.toFixed(3)}%`);
        addRow(`(${IMAGE_DATA.pixelsContainMessage} / ${IMAGE_DATA.totalPixels})`, ' pixels');
        updateStatus(`Downloaded ${filename}`);
        document.getElementById('btn-encrypt').disabled=false;
    });
};
decrypt=_=>{
    let text = readImage();
    let index = text.indexOf(STOP_IDENTIFIER)
    if (index>1){
        text = text.substring(0,index)
    }
    TEXTAREA.value=text;
    if (detectHTML(text)){
        updateStatus('Text retrieved from image. It contains a html page!');
        document.getElementById('btn-writeHtml').style.display = 'block';
        document.getElementById('btn-decrypt').style.display = 'none';
    } else {
        updateStatus('Text retrieved from image')
    };
}
detectHTML=text=>{
    /*
    Return true if the text contains a part that starts with
    <html> and ends with </html>. Also set the html text in the global DETECTED_HTML variable
    Return false if not.
    */
    let startIndexDoctype = text.indexOf('<!DOCTYPE html>');
    let startIndex = text.indexOf('<html>');
    if (startIndexDoctype>-1 && startIndex>startIndexDoctype+15){
        // there is a <!DOCTYPE html>, followed by <html>, start at tje
        // DOCTYPE, in all other cases, leave the start index to look at <html>
        startIndex = startIndexDoctype;
    }

    let endIndex = text.indexOf('</html>')
    if (startIndex>-1 && endIndex>6){  // choose 6 to ensure it appears after <html>
        DETECTED_HTML = text.slice(startIndex, endIndex+6);
        return true;
    }
    return false;
}
writeHtml=_=> {
    updateStatus('This page will be replaced by the html content from the image. This can take a few seconds...');
    new Promise((resolve)=>document.write(DETECTED_HTML)).then(() => {})
};

fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            IMAGE = img;
            C.width = img.width;
            C.height = img.height;
            IMAGE_DATA.width = img.width;
            IMAGE_DATA.height = img.height;
            IMAGE_DATA.totalPixels = img.width * img.height;
            IMAGE_DATA.name = file.name;

            let halfSpace = (window.innerWidth - 200) / 2;  // sidebar has width of 200 px.
            TEXTAREA.style.width = `${halfSpace}px`;
            C.style.width=`${halfSpace}px`;
            C.style.height=`${halfSpace*img.height/img.width}px`;
            X.drawImage(img, 0,0);
            updateStatus(`${file.name} selected`);
            addRow('Image width', IMAGE_DATA.width);
            addRow('Image height', IMAGE_DATA.height);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});
resetImages=()=>{
    IMAGE=undefined;
    IMAGE_DATA = {}
    DETECTED_HTML=undefined;
    DATA_TABLE.innerHTML='';
    X.fillRect(0,0,C.width,C.height);
    TEXTAREA.value = '';
    document.getElementById('btn-writeHtml').style.display = 'none';
    document.getElementById('btn-decrypt').style.display = 'block';
    updateStatus(`${IMAGE_DATA.name||'no image'} selected`);
};
