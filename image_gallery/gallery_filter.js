IMAGES = [];
SEPARATOR = '__';
POPULATED = false;

selectFiles=()=>{
    var fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.addEventListener('change', handleFileSelect, false);
};

getAttributes=filename=>{
    let pairs = [];
    let parts = filename.split(SEPARATOR)

    for (let i = 1; i < parts.length - 1; i += 2) {
        pairs.push([parts[i], parts[i + 1]]);
    }
    return pairs
}

FEATURES = {};
FEATURE_KEYS = [];
FILTER_VALUES = [];  // populate this with a single value for each key

isFloat=str=>{
  const num = parseFloat(str);
  return !isNaN(num) && isFinite(num);
}
isInt=str=>{
  const num = parseInt(str, 10);
  return !isNaN(num) && isFinite(num) && Number.isInteger(num);
}
isAllNumeric=(arr, method)=>{  // either use the int check or the float check
    for (let i=0; i<arr.length; i++){
        if (!method(arr[i])){return false}
    }
    return true;
}

handleFileSelect=(event)=>{
    var selectedFiles = event.target.files;

    for (let i=0; i<selectedFiles.length; i++) {
        let file = selectedFiles[i];
        let img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'gallery-image'

        let file_name = file.name.split('.')[0];  // make sure to exclude the .jpeg part (and assume no points in the name)
        getAttributes(file_name).forEach(pair=>{
            img.setAttribute(`data-${pair[0]}`, pair[1]);

            // also keep track of all the keys and values we have (these are feature names + according values)
            // Create an object to store unique values for each key
            if (!FEATURES[pair[0]]) {
                FEATURES[pair[0]] = new Set(); // Initialize a Set for the key if it doesn't exist
            }
            FEATURES[pair[0]].add(pair[1]); // Add the value to the Set
        })

        IMAGES.push(img);
    }

    // since all FEATURE data is collected, set the keys, and sort the possible values
    FEATURE_KEYS = Object.keys(FEATURES);  // set the FEATURES keys, we know which values they have

    // order the values in the FEATURES dict, it is currently a set, replace that set with an Array that is sorted
    for (let i=0; i<FEATURE_KEYS.length; i++){
        FILTER_VALUES.push('all');  // for each key value, there is a corresponding filter value. The default is 'all'
        let keyName = FEATURE_KEYS[i];
        let array = Array.from(FEATURES[keyName])

        if (isAllNumeric(array, isInt)){
            array = array.sort((a, b) => parseInt(a) - parseInt(b));
        } else if (isAllNumeric(array, isFloat)) {
            array = array.sort((a, b) => parseFloat(a) - parseFloat(b));
        } else {
            // alphabetically sorting should work otherwise
            array.sort();
        }
        FEATURES[keyName] = array;
    }
    document.getElementById('selected_files_span').innerHTML = `${IMAGES.length} selected`;
};
resetImages=()=>{
    IMAGES=[];
    document.getElementById('selected_files_span').innerHTML = `${IMAGES.length} selected`;
};


showImage=img=>{
    // just return false as soon as there is a filter value that does not match

    for (let i=0; i<FEATURE_KEYS.length; i++){
        let featureName = FEATURE_KEYS[i];
        let filterValue = FILTER_VALUES[i];

        if (filterValue === 'all'){
            // everything is fine, no need to fail
        } else {
            // see if the image matches
            let dataAttr = `data-${featureName}`;
            if (filterValue != img.getAttribute(dataAttr)){
                return false;  // the filter value is not all, so it is something specific, it should match exactly
            };
        }
    }
    return true;
}


applyFilters=_=>{
    if (!POPULATED){populateGrid()}

    // now determine the filters, and only apply display none or block on each image
    IMAGES.forEach((img) => {
        if (showImage(img)){
            img.style.display = 'block'; // Show the image
        } else {
            img.style.display = 'none'; // Hide the image
        }
    })
    // const summerImages = document.querySelectorAll('img[data-palette="summer"]');
}


populateGrid=_=>{
    let grid = document.getElementById('image-grid')

    // Iterate through the image file names and create image elements
    IMAGES.forEach((img, index) => {
        grid.appendChild(img);
    });
}
