/*
This application will render and save images by refreshing the page several times.

This code will draw a random concept artwork on a 400x600 pixel canvas,
drawing circles only using the ('xor' globalCompositeOperation).

A few random features are specified on top of the file, these are the characteristics
of the artwork. They are also logged in the console. These features are:

    Palette
    Margin
    Background
    Layout
    Correct

When saving an image, all 5 of these values including the value will be added to the filename.
This will be done in a specific format, so that those values can be parsed easily when analyzing
these files.

In Chrome, you might be asked to accept multiple file download, which can mess things up. In Firefox this works for me.
*/
randomChoice=items=>items[Math.random()*items.length|0];

// the canvas is fixed at 400 x 600 pixels (width x height) for this example. The MARGIN below is an absolute value in pixels as well
WIDTH = 400;
HEIGHT = 600;
MARGIN = randomChoice([8, 20, 40, 80, 100]);
PALETTE = randomChoice([
    [['#d22', '#017', '#fd4', '#000'], 'PrimaryBlack'],
    [['#d22', '#017', '#fd4'], 'Primary'],
    [['#000'], 'Black'],
    [['#000', '#000', '#000', '#000', '#d22'], 'BlackRed'],
]);
BACKGROUND_COLOR = randomChoice(['black', 'white']);
CIRCLE_COUNT = 2 + Math.random()*115|0;  // an integer, either 1,2 or 3;
// convert the CIRCLE_COUNT to a string value that roughly describes the value.
// This string value is used as a characteristic to describe the artwork
LAYOUT = 'Average'  // default value, if not compy to the following 2 statements, it is 'Average'
if (CIRCLE_COUNT<21){
    LAYOUT = 'Minimal';
} else if (CIRCLE_COUNT>55){
    LAYOUT = 'Crowded';
}
CORRECT = Math.random()<.7;  // value true in 70% of the cases,  false 30% of the cases


// nicely display the features in a table
FEATURES = {
    'Palette': PALETTE[1],
    'Margin': MARGIN,
    'Background': BACKGROUND_COLOR,
    'Layout': LAYOUT,
    'Correct': CORRECT?'Yes':'No',
}
console.table(FEATURES)


COORDINATES = [];
for (let i=1;i<=CIRCLE_COUNT;i++){
    COORDINATES.push([Math.random()*WIDTH,Math.random()*HEIGHT]);
}

// Set the canvas dimension, background color, etc
C.width = WIDTH;
C.height = HEIGHT;
X = C.getContext('2d');
X.fillStyle = BACKGROUND_COLOR;
X.fillRect(0,0,WIDTH, HEIGHT);
C.style.background='#fff';
document.body.style.background='#aaa'  // a light gray color for the html page
X.globalCompositeOperation='xor';


COORDINATES.forEach(co=>{
    /*
    For each coordinate, draw a circle with a certain radius and a random color from the PALETTE.

    First calculate the distance from the coordinate to the border of the canvas, and take the minimum of the following:

    The x value: equals the distance to the left side of the canvas.
    WIDTH-x: equals the distance to the right side of the canvas.
    The y value: equals the distance to the top.
    The HEIGHT-y: value equals the distance to the bottom
    */
    let minDist = Math.min(co[0],co[1],WIDTH-co[0],HEIGHT-co[1]);
    // when the above value is used as the radius, the circle will touch the closest border

    // But in case that distance to the edge of tha canvas is smaller than the MARGIN, return 1 instead
    // This results in small circles being drawn near the borders.
    let maxRadius = Math.max(1, (minDist-MARGIN))

    // instead of using the maximum Radius, use a random value between 0 and this maxRadius
    // 1- R()*R()  makes the random distribution closer to 1 than to 0, so circles are relatively closer to
    // the calculated maxRadius compared to using the default random distribution
    let radius = (1-Math.random()*Math.random())*maxRadius;

    // now fill an arc. A proper arc starts with 'beginPath' and ends with 'closePath'.
    // However, when commenting those two lines, a line will be drawn from the previous arc to the next one,
    // which can result in pretty interesting and crazy results.
    // This was not the intended behaviour for drawing circles only!
    // I choose to allow these in the code, by using the CORRECT feature.
    // So when CORRECT is true, the part after the && operator will be executed.
    CORRECT && X.beginPath();
    X.arc(co[0],co[1],radius, 0, Math.PI*2);
    X.fillStyle=randomChoice(PALETTE[0]);
    X.fill();
    CORRECT && X.closePath();
})
// The above code is all that is needed to generate these artworks!
// (When you remove the comments and logging of the features etc. you'll find that it's less than 30 lines of code)

// however, the xor results in transparent regions. You can see this for a saved image without calling the method
// below. The inner areas of the shapes that are white in the browser, have actually became transparent.
// This can be fixed by looping through all pixel values and set the fully transparent ones to white (255,255,255,255)
// Not fully transparent pixels can keep the rgb values they have, just set the alpha value to 255.
// this does not improve the image quality! Check how it looks with and without this!
// When making the image much larger, the quality will improve (try multiplying the WIDTH and HEIGHT values)
fixTransparency=()=>{
    const imageData = X.getImageData(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < imageData.data.length; i += 4) {  // steps of 4 since there are 4 channels, RGB & alpha
        if (imageData.data[i + 3] === 0) {  // If alpha is not 255, there is some transparency,, when it is 0, fully transparent
            // Fill the transparent pixel with a specific color
            imageData.data[i] = 255;   // Red
            imageData.data[i + 1] = 255; // Green
            imageData.data[i + 2] = 255; // Blue
            imageData.data[i + 3] = 255; // Alpha
        }
        else if (imageData.data[i + 3] < 254){
            imageData.data[i + 3] = 255; // Alpha
        }
    }
    // Put the modified pixel data back onto the canvas
    X.putImageData(imageData, 0, 0);
}
fixTransparency();


//
// SAVE THE CANVAS AS AN IMAGE
//

// helper methods to get a nicely formatted timestamp:
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
// convert the features to a filename string, also include the timestamp and name.
featuresToString=(obj, separator='__')=>{
    /*
    Be aware of unwanted values in a filename, prevent dots and spaces etc. Also take formatting into account
    you probably dont want floats like 1.232399929929293434343 appear in the filename

    An example output could be
    Palette__Black__Margin__20__Background__white__Layout__Minimal__Correct__Yes

    So every feature name and value is separated with a double underscore.
    In another program, these values can be parsed from the filename, by splitting on the double underscore,
    and construct the pairs (feature name, value)

    FILENAME.split(separator)  will return an Array of the parts, where the first part can be ignored,
    it holds the timestamp and name. Every two items after that are a key-value pair.
    So in this example FILENAME.split('__')[1]  is 'Palette' and FILENAME.split('__')[2] is 'Black'

    The below could work to construct am array of pairs from such FILENAME

    pairs = [];
    parts = FILENAME.split('__')

    for (let i = 1; i < parts.length - 1; i += 2) {
      pairs.push([parts[i], parts[i + 1]]);
    }
    */
    const keyValuePairs = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            keyValuePairs.push(`${key}${separator}${value}`);
        }
    }
    return separator + keyValuePairs.join(separator);
}
FILENAME = getTimestamp() + '_xorCircles' + featuresToString(FEATURES);  // xorCircles as the title for this work
console.log(FILENAME)


/*
The saveImage method below can be called with the extension parameter 'png' for higher quality outputs.
The default 'jpeg' is more efficient for quickly generating a bulk of outputs that takes less space

It does need an actual link to click on (an <a> html element). This is added in the code below,
this is done so that the method below can be easily copy/pasted into any project, without additional requirements.

If you call that method multiple times, you might not want to create html elements every time, you can just add
<a id='link'> </a> to the html,  and replace the link below with var link = document.getElementById('link')
or you can define  var link = document.createElement('a'); anywhere else in this javascript file in the global scope.
So that it is defined only once, and it is available below

For the filename, you can add a timestamp, add the parameters you want to be displayed in the filename, and a hash
of you have any (when making generative art with a pseudo random number generator). It is worth it to think a few
seconds what you want to display in the filename, as it can save you time whenever you will go through a large folder
*/
saveImage=(canvas, filename, extension='jpeg')=>{
    var link = document.createElement('a');
    link.setAttribute('download', filename);
    link.setAttribute('href', canvas.toDataURL(`image/${extension}`));
    link.click();
    console.log('Saved ' + filename + `.${extension}`);
}

// This example uses a value from the url parameters. It can be used as a stop definition. In this case, there is a
// counter, and after every saveImage, the page will be reloaded with the counter value being one less. When it reaches
// 0 it will not reload anymore.  So when you set ?counter=100 in the url, you can generate 100 images automatically
// when not setting it at all, a default value of 5 will be used
let counter = new URLSearchParams(window.location.search).get('counter');
if (counter === null){
    counter = 5  // default to 5, save image, for the next reload it will be set to 4
} else {
    counter = parseInt(counter);  // make sure it is an integer. No proper error handling here, this will fail if counter is a non numerical value
}

// now call the save method with the timeStamp in the filename. Then reload the page with an updated value for the counter
saveImage(C, FILENAME, 'jpeg')

if (counter > 0){
    // make sure the updated counter value is added to the url parameters. Changing the location will reload the page!
    window.location = window.location.pathname + '?counter='+(counter - 1).toString();
}


//setTimeout(()=>{saveImage(C, file_name);}, 1000);

// note that in this example, the png file can have transparent regions, while the jpeg will render the background of the canvas

// ideas for url parameters:
// you can use as many as you want, and iterate through several of them, however, it could be as easy to only use a counter
// you can translate a counter to several values. For example if you want to iterate over 5 color palettes and 3 styles
//
