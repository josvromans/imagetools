IMAGES = [];

shuffleArray=(array)=>{
  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  // While there are elements remaining to shuffle
  while (currentIndex !== 0) {
    // Pick a remaining element
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // Swap the current element with the random element
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};
generateCollage=()=>{
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);
    let bgColor = document.getElementById("bg_color").value;
    let repeat = parseInt(document.getElementById("bg_repeat").value);
    let bgScale = parseFloat(document.getElementById("bg_scale").value);
    let fgScale = parseFloat(document.getElementById("fg_scale").value);

    C.width = width;
    C.height = height;
    C.style.width=`${width}px`;
    C.style.height=`${height}px`;

    X=C.getContext('2d');
    X.fillStyle=bgColor;
    X.fillRect(0,0,width,height);

    if (IMAGES.length<1){alert('No Images selected!');return;}

    // draw every selected image with a random rotation, Do this <repeat> times
    for (let i=0;i<repeat;i++){
        IMAGES = shuffleArray(IMAGES);
        IMAGES.forEach(i=>pasteImage(Math.random()*360,i,bgScale));
    }

    if (!document.getElementById("fg_checkbox").checked){return;}

    // add the mask on the background, just draw a rectangle with certain color and alpha value
    X.globalAlpha=parseFloat(document.getElementById("mask_alpha").value);
    X.fillStyle=document.getElementById("mask_color").value;
    X.fillRect(0,0,width, height);
    X.globalAlpha=1;

    // paste n images on the foreground
    IMAGES = shuffleArray(IMAGES);
    let randomTilt = parseFloat(document.getElementById("random_tilt").value);
    let imagesForeground = parseInt(document.getElementById('foreground').value);

    for (let i=0; i<imagesForeground; i++){
        let tilt = Math.random()*randomTilt*2-randomTilt;
        let xCo = width/(2*imagesForeground) * (1+2*i);

        if (i>=IMAGES.length){
            console.log('There are less images selected than to be drawn on the foreground.');
            return;
        }

        pasteImage(tilt, IMAGES[i], fgScale, xCo,height/2);
    }
};
selectFiles=()=>{
    var fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.addEventListener('change', handleFileSelect, false);
};
handleFileSelect=(event)=>{
    var selectedFiles = event.target.files;

    for (let i=0; i<selectedFiles.length; i++) {
        let file = selectedFiles[i];
        let img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        IMAGES.push(img);
    }
    document.getElementById('selected_files_span').innerHTML = `${IMAGES.length} selected`;
};
resetImages=()=>{
    IMAGES=[];
    document.getElementById('selected_files_span').innerHTML = `${IMAGES.length} selected`;
};
pasteImage=(degrees,image,scale,x,y)=>{
    // when x,y are not given, assign a random position on the canvas
    if (x===undefined){x = C.width*Math.random();}
    if (y===undefined){y = C.height*Math.random();}

    // save the unrotated context of the canvas so we can restore it later
    // the alternative is to untranslate & unrotate after drawing
    X.save();

    // move to the x,y position
    X.translate(x,y);

    // rotate the canvas to the specified degrees
    X.rotate(degrees*Math.PI/180);

    // Calculate scaled width and height based on the original image dimensions and scale factor
    let scaledWidth = image.width * scale;
    let scaledHeight = image.height * scale;

    // draw the image, since the context is rotated, the image will be rotated also
    X.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

    // we’re done with the rotating so restore the unrotated context
    X.restore();
};
handleFgCheck=()=>{
  var checkbox = document.getElementById("fg_checkbox");
  document.getElementById("fg_area").style.display = checkbox.checked?"block":"none";
};
prefix0=nr=>{
    let str = nr.toString();
    return (str.length<2)?'0' + str:str;
};
getTimestamp=()=>{
    const date = new Date();
    year=date.getFullYear();
    month=prefix0(date.getMonth()+1);
    day=prefix0(date.getDate());
    hour=prefix0(date.getHours());
    mins=prefix0(date.getMinutes());
    sec=prefix0(date.getSeconds());
    return `${year}${month}${day}_${hour}${mins}${sec}`;
};
saveImage=()=>{
    let filename = document.getElementById('filename').value;
    let extension = document.getElementById('extension').value;

    filename = getTimestamp() + '_' + filename;
    link.setAttribute('download', filename);
    link.setAttribute('href', C.toDataURL(`image/${extension}`));
    link.click();
    console.log(`Saved ${filename}.${extension}`);
};
updateButton=()=>{
    let selectedValue = document.getElementById("save_n_count").value;
    document.getElementById("save_n_button").innerHTML=`Save ${selectedValue} outputs`;
};
saveNImages=()=>{
    performNTimes=n=>{
        if (n > 0) {
            generateCollage();
            saveImage();

            // Call recursively with n-1 and a delay of 1000 milliseconds = 1 second
            setTimeout(()=>{performNTimes(n-1);}, 1000);
        }
    };
    performNTimes(parseInt(document.getElementById("save_n_count").value));
};

// Improvements:
// - add presets for Twitter banner  OpenSea banner etc  1500x500  1400x350
// - add option to chose the foreground images separately from the background
// - Add 'Save image' under ctrl-s key press
// - generate a collage instantly after selecting files?
// - improve JS structure, with DOM content loaded and proper access of X,C values for 2d context/canvas
