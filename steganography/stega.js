IMAGE = undefined;
IMAGE_NAME = 'no image';
STOP_IDENTIFIER = '<<STOP>>';
X=C.getContext('2d', { 'willReadFrequently': true });
MAX_CHARACTERS_TO_READ = new URLSearchParams(window.location.search).get('max_characters') || 20000;
MAX_ITERS = parseInt(MAX_CHARACTERS_TO_READ)*8/3*4;
MAX_ITERS = (MAX_ITERS / 4|0)*4;  // round down to closest multiple of 4
var DETECTED_HTML;

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
        if (i%4===3){continue}  // ignore alpha channel
            let v = imgData.data[i];  // currentValue
            let target = targetBinaryString[stringIndex]  // targetBinary
            imgData.data[i] = v%2 === parseInt(target)?v:v<1?1:v>254?254:v+[-1,1][Math.random()*2|0];
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
        let filename = 'ENCRYPTED__' + IMAGE_NAME;
        link.setAttribute('download', filename);
        link.setAttribute('href', C.toDataURL("image/png"));
        link.click();
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
            IMAGE_NAME = file.name;
            C.width = img.width;
            C.height = img.height;

            let halfSpace = (window.innerWidth - 200) / 2;  // sidebar has width of 200 px.
            TEXTAREA.style.width = `${halfSpace}px`;
            C.style.width=`${halfSpace}px`;
            C.style.height=`${halfSpace*img.height/img.width}px`;
            X.drawImage(img, 0,0);
            updateStatus(`${IMAGE_NAME} selected`);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});
resetImages=()=>{
    IMAGE=undefined;
    DETECTED_HTML=undefined;
    IMAGE_NAME = 'no image';
    X.fillRect(0,0,C.width,C.height);
    TEXTAREA.value = '';
    document.getElementById('btn-writeHtml').style.display = 'none';
    document.getElementById('btn-decrypt').style.display = 'block';
    updateStatus(`${IMAGE_NAME} selected`);
};
