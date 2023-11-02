const SEPARATOR = new URLSearchParams(window.location.search).get('separator') || '__';

IMAGES = [];
IMAGES_SHOWN = 0;
ALL_VALUE = 'all';  // the value displayed that means: all items are selected
FEATURES = {};  // a dictionary with keys being the feature names, and for each featureName, the possible values
FEATURE_KEYS = [];
SELECTED_FILTERS = {};  // whenever a selection is made in the front end, this list will be updated
MAX_AMOUNT_OF_ELEMENTS = 4;

selectFiles=()=>{
    var fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.addEventListener('change', handleFileSelect, false);
};

getAttributes=filename=>{
    let pairs = [];
    let parts = filename.split(SEPARATOR)

    for (let i=1; i<parts.length-1; i+=2) {
        pairs.push([parts[i], parts[i + 1]]);
    }
    return pairs
}

// Function to shuffle the order of an array randomly
shuffleArray=array=>{
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}
shuffleImages=_=>{
    const imageGrid = document.getElementById('image-grid');
    const imgElements = imageGrid.getElementsByTagName('img');

    // Shuffle the order of the <img> elements
    let ar = Array.from(imgElements);
    shuffleArray(ar);
    // Update the DOM with the shuffled order
    ar.forEach((img) => imageGrid.appendChild(img));
}

handleFilterClick=e=>{
    let selectedValue = e.target.value;
    let parentSelect = e.target.parentElement;
    let featureName = parentSelect.name;

    // first: whenever the ALL_VALUE has been selected, unselect all other options, as it does not make sense
    // to select ALL and also 1 or 2 other values.
    let selectedFilterValues = ALL_VALUE;  // default is 'all', if it is not all, it will be the array with selected option
    if (selectedValue === ALL_VALUE){
        // we could check the ALL_VALUE here, but it is always added as the first element. So Start at 1 instead of 0
        for (let i=1; i<parentSelect.options.length; i++) {
            parentSelect.options[i].selected = false;
        }
    } else {
        // make sure to unselect the all value, just in case. When clicked on an actual value, the all should be unselected
        parentSelect.options[0].selected = false;

        selectedFilterValues = [];
        for (let i=1; i<parentSelect.options.length; i++) {
            if (parentSelect.options[i].selected){
                selectedFilterValues.push(parentSelect.options[i].value)
            }
        }
    }
    // set the SELECTED_FILTERS for this specific feature with the updated value
    SELECTED_FILTERS[featureName] = selectedFilterValues;
}
setBackgroundColor=_=>document.body.style.background=document.querySelector('.color-picker').value;
setBackgroundColor();
constructUIFilters=_=>{
    let selectContainer = document.getElementById('filters');
    let selectTitles = document.getElementById('filterTitles');
    selectContainer.innerHTML = '';  // in case something was there, delete it, as the filters will be constructed from scratch
    let selectWidth = `${100 / FEATURE_KEYS.length}%`;  // set the select width to this percentage

    for (let i=0; i<FEATURE_KEYS.length; i++){
        let featureName = FEATURE_KEYS[i];
        let optionsArray = FEATURES[featureName];
        optionsArray.unshift(ALL_VALUE);  // Add the option all as the first option

        // Create a new select element
        const selectElement = document.createElement('select');
        selectElement.name = featureName;
        selectElement.id = featureName;
        selectElement.multiple = true; // Enable multiple selection
        selectElement.size = MAX_AMOUNT_OF_ELEMENTS;
        selectElement.style.width = selectWidth;

        // add a div just to show a title, the feature name, above each list of filter options
        let titleDiv = document.createElement('div');
        titleDiv.innerHTML = featureName;
        titleDiv.style.width = selectWidth;
        titleDiv.classList.add('titleItem');

        selectTitles.appendChild(titleDiv);

        // Populate the select element with options
        optionsArray.forEach(optionValue => {
            const optionElement = document.createElement('option');
            optionElement.value = optionValue;
            optionElement.text = optionValue;
            optionValue==ALL_VALUE && (optionElement.selected = true);
            selectElement.appendChild(optionElement);

            optionElement.addEventListener('click', handleFilterClick);
        });

        // Append the select element to the document
        selectContainer.appendChild(selectElement);
    }
}


isAllInt=arr=>{
    for (let i=0; i<arr.length; i++){
        let num = parseInt(arr[i], 10);
        let isInt = !isNaN(num) && isFinite(num) && Number.isInteger(num);

        if (!isInt){return false}
    }
    return true;
}

const widthSlider = document.getElementById('width-slider');
const gapSlider = document.getElementById('gap-slider');
const gridContainer = document.getElementById('image-grid');

updateGrid=_=>{
    // set the width of the grid (number of items in a row)
    let rowCount = widthSlider.value;
    gridContainer.style.gridTemplateColumns = `repeat(${rowCount}, 1fr)`;

    // the gap is in pixels, base it on how width a row is
    gridContainer.style.gap = `${parseInt(gapSlider.value) * window.innerWidth / rowCount * 0.01|0}px`;
}
widthSlider.addEventListener('input', updateGrid)
gapSlider.addEventListener('input', updateGrid)

handleFileSelect=(event)=>{
    var selectedFiles = event.target.files;

    for (let i=0; i<selectedFiles.length; i++) {
        let file = selectedFiles[i];
        let img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'gallery-image';

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
        let keyName = FEATURE_KEYS[i];

        SELECTED_FILTERS[keyName] = ALL_VALUE;  // set the filter value to the ALL_VALUE by default
        let array = Array.from(FEATURES[keyName])

        // only sort on integer or strings. Not handling floats, as filenames containing points are not encouraged.
        // however, when they are not the first or ast character, it can work. When you modify the code to do so,
        // find the file.name.split('.')[0] in this file, and account for dots in filename parameters
        // currently I assume everything before the dot is the filename, and the part after is the extension
        if (isAllInt(array)){  // if all items in the array are valid integers, sort on numeric values
            array = array.sort((a, b) => parseInt(a) - parseInt(b));
        } else {
            // alphabetically sorting should work otherwise
            array.sort();
        }
        FEATURES[keyName] = array;

        // to determine the height of the features select/options, we need to grab the maximum amount of choices
        // and use that value for all <selects>. Use +1 because the ALL_VALUE will also be added
        console.log(array.length + 1);
        if (array.length + 1>MAX_AMOUNT_OF_ELEMENTS){
            MAX_AMOUNT_OF_ELEMENTS=array.length + 1;
        }
    }

    // the images are loaded, now hide the select files button, and show the apply filter button
    document.getElementById('button-select-files').style.display = 'none';
    document.getElementById('button-apply-filters').style.display = 'block';

    // populate the grid
    let grid = document.getElementById('image-grid')
    IMAGES.forEach(img=>grid.appendChild(img));
    updateGrid();  // call this, so that the sliders correspond with the actual grid

    // construct the UI elements and apply the filters (default will be show all)
    constructUIFilters();
    applyFilters();
};
resetImages=()=>{
    IMAGES=[];
    FEATURES = {};
    FEATURE_KEYS = [];
    document.getElementById('filters').innerHTML = '';
    document.getElementById('image-grid').innerHTML = '';
    document.getElementById('selected_files_span').innerHTML = `${IMAGES.length} selected`;

    document.getElementById('button-select-files').style.display = 'block';
    document.getElementById('button-apply-filters').style.display = 'none';
};

oneMatchingFilter=(img, featureName, valueArray)=>{
    /*
    Take an img element, determine the data-attribute that corresponds with the featureName.
    Iterate through all items in the valueArray, as soon as one value matches with the image property, return true

    When none of the values in the array match, return false.
    */
    let dataAttr = `data-${featureName}`;
    let imgProperty = img.getAttribute(dataAttr);

    for (let j=0; j<valueArray.length; j++){
        if (valueArray[j] === imgProperty){
            return true;
        };
    }
    return false;
}

determineImageDisplay=img=>{
    /*
    Determine if an img should be shown or hidden, based on the selected filters.
    Return 'block' when it should be shown, 'none' if it should be hidden.
    */
    for (let i=0; i<FEATURE_KEYS.length; i++){
        let featureName = FEATURE_KEYS[i];
        let filterValue = SELECTED_FILTERS[featureName];

        if (filterValue !== ALL_VALUE){  // when it is the ALL_VALUE, any value is allowed, never return false
            // when it is not the ALL_VALUE, it is an array. See if at least one item in the array matches
            if (!oneMatchingFilter(img, featureName, filterValue)){
                return 'none';
            }
        }
    }
    IMAGES_SHOWN ++;
    return 'block';
}
applyFilters=_=>{
    IMAGES_SHOWN = 0;

    // for each image, set it to visible or not visible, based on the filters
    IMAGES.forEach(img => img.style.display = determineImageDisplay(img))

    document.getElementById('selected_files_span').innerHTML = `Showing ${IMAGES_SHOWN} / ${IMAGES.length}`;
}
