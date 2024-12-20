Why?
====

This is made to add text to images, invisible to most viewers, but in plain sight for steganographers.
My personal use case is to add the code that was needed to generate an image, INTO the image data itself, since it is free (not taking extra space).
I make digital artworks generated by code, so this way, I can deliver a single PNG file as the output, but that file will actually also contain the input script.

What to know?
=============
- This only works for PNG files
- The output image will change, but the color value in a single pixel can only change 3 units inside the possible space of 16 million values. So it will be practically invisible to see.
- Only text characters in the 0-255 ascii range can be encoded in this method, all characters outside this set will be ignored (replaced by space)
- whenever you resize or compress the image, you will loose the message
- The code adds '\~\~END\~\~' at the end of a message, so that when reading a message from the image, it knows where the message ends 
- The code will only read up to 20,000 text characters from an image. This is to prevent displaying 100 thousands of characters when uploading a large png file.
When you want more that 20,000 characters, add: "?max_characters=1000000" to the url, and use a big number.
- Hiding text into an image is fast for texts of a few thousands characters in a normal size PNG file. 
But there is currently no feedback when the image on the screen was actually changed.
- You can simply check if things work by using 'Emded Text In Image And Download', when adding an actual text in the right text area.
Afterwards, you can 'Read Text From Image' for both the original file and the embedded file, to see that the original file will output some random characters, and the encrypted file should output exactly the message you used.


Disclaimer: this is not made to hide the text message in any sophisticated way.
Look into 'steganography' for strategies on encrypting messages into images in ways that are hard for others to discover.

I actually used the very simplest way I could think of myself, this is really just a 'back of the envelope' implementation that does the job.

I wrote a blogpost with some explanation about pixel values, RGB values, and least significant bits [on my website](https://www.josvromans.art/writing/2024/10/steganography)


How does this work?
===================
Each image consists of pixels. Each single pixel consists of a value for the
red, green and blue values. These are the color channels. There can also be an alpha value, which indicates transparency.
For this application, the alpha value is completely ignored, and we only look at the RGB values.

So the RGB values for a single pixel can be [255,100,10] for example.
Each value is an integer in the range 0 - 255. This example means the maximum amount of red (255), 100 green, and a tiny bit (10/255) of blue.
[255,100,10] represents an 'orange' color.

To read data from the image, these RGB values for each pixel will be read sequentially, and only the last bit is interpreted to contain a message.
This means: check if the value is odd or even. [255,100,10] will be read as '100' (odd, even, even).
This will be done for all pixels (until a stop indicator has been determined), so a string of 1's and 0's will be constructed.
Every eight characters in such string of 1's and 0's, represents a text character. So '00100011' represents the integer value 35 (32+2+1), which translates to the text character '#' (hashtag).
Using ASCII table, where every byte (8 bits) represents one of 255 text characters.

This means, that for every image, you can read a text from the image data, by looking at those color channel values being odd or even.
For a standard image, this will return a 'text' of random characters.
To encrypt meaningful text inside the image, you have to convert the text to the binary string, and then make sure every color value is odd or even in a way that matches that binary string.
This means that about 50% of the color values can be unchanged (it is either odd or even already), and the ones that do not match, have to be flipped.

There are 256 possibilities for each color channel, which results in over 16 million different color values for a single pixel (256 * 256 * 256).
Changing some of these color channel values with unit 1, out of 256 options, is a minor change that does not appear to affect the image in a way that a human can notice.

So there is a lot of 'space' inside an image to add a message. And adding it this way is basically free, the size of the image will not be increased by changing those color values with +1 or -1.
The encrypted image will have a different size than the original though, it can be slightly smaller or slightly larger in size.
