IMAGE = undefined;
IMAGE_NAME = 'no image';
STOP_IDENTIFIER = '<<STOP>>';
X=C.getContext('2d', { 'willReadFrequently': true });
MAX_CHARACTERS_TO_READ = new URLSearchParams(window.location.search).get('max_characters') || 20000;
MAX_ITERS = parseInt(MAX_CHARACTERS_TO_READ)*8/3*4;
MAX_ITERS = (MAX_ITERS / 4|0)*4;  // round down to closest multiple of 4


convertTextToBinary=text=>{
    let binary = '';
    for (let i=0; i<text.length; i++){
        let charCode = text.charCodeAt(i);

        if (charCode>255){
            console.error(text[i], ' has a charCode outside the range 0-255, it has been replaced by a space')
            charCode = 32;  // default to space
        }
        let binaryString = charCode.toString(2);
        binaryString = String(binaryString).padStart(8, '0')

        binary += binaryString;
    }
    return binary;
}
convertBinaryTextToText=binary=>{
    // binary is a string '01110101010101010101001...' and has to be chopped in substrings of length 8
    // expect only characters in 0-255 char range, which has exactly length 8
    let text = '';

    for (let i=0; i<binary.length; i+=8){
        let substring = binary.slice(i, i+8);
        let intValue = parseInt(substring, 2);
        let textChar = String.fromCharCode(intValue);
        text += textChar;
    }
    return text;
}
readImage=_=>{
    let binaryString = '';
    const imageData = X.getImageData(0, 0, C.width, C.height);
    for (let i = 0; i < imageData.data.length; i ++) {  // steps of 4 since there are 4 channels, RGB & alpha
        if (i%4===0){continue}  // ignore alpha channel
        if (i>MAX_ITERS){break}
        binaryString += imageData.data[i] % 2;  // just add 0 or 1 to the binary string
    }
    return convertBinaryTextToText(binaryString);
}
encryptTextIntoImage=text=>{
    let targetBinaryString = convertTextToBinary(text);
    let imgData = X.getImageData(0, 0, C.width, C.height);  // get rid of width/height?
    let stringIndex=0;

    for (let i = 0; i < imgData.data.length; i++) {  // steps of 4 since there are 4 channels, RGB & alpha
        if (i%4===0){continue}  // ignore alpha channel
            let v = imgData.data[i];  // currentValue
            let target = targetBinaryString[stringIndex]  // targetBinary
            imgData.data[i] = v%2 === parseInt(target)?v:v<1?1:v>254?254:v+[-1,1][Math.random()*2|0];
            stringIndex ++;  // position in target binary string, should not increment when i%4===0 (when it is the alpha channel)
        if (stringIndex > targetBinaryString.length-1){break}
    }
    X.putImageData(imgData, 0, 0);
}
encrypt=_=>encryptTextIntoImage(TEXTAREA.value + STOP_IDENTIFIER)
decrypt=_=>{
    let text = readImage();
    let index = text.indexOf(STOP_IDENTIFIER)
    if (index>1){
        text = text.substring(0,index)
    }
    TEXTAREA.value=text;
}
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
            selected_files_span.innerHTML = `${IMAGE_NAME} selected`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});
resetImages=()=>{
    IMAGE=undefined;
    IMAGE_NAME = 'no image';
    X.fillRect(0,0,C.width,C.height);
    TEXTAREA.value = '';
    selected_files_span.innerHTML = `${IMAGE_NAME} selected`;
};
saveImage=()=>{
    let filename = 'ENCRYPTED__' + IMAGE_NAME;
    link.setAttribute('download', filename);
    link.setAttribute('href', C.toDataURL("image/png"));
    link.click();
    console.log(`Saved ${filename}`);
};
