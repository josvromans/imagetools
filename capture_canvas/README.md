Capture Canvas
================

An example webpage, that creates random artworks and saves the content of the html canvas as a jpeg image (png is also possible).
This will be done in bulk, so you could save 100 different iterations by navigating to the webpage once. It will refresh automatically. 
This can work by putting ?counter=100 at the end of the url. When not adding anything, the default will be 5.
So when opening the below page, it will generate and save 5 images in your Downloads folder.

Try it out here: [https://josvromans.github.io/imagetools/capture_canvas/index](https://josvromans.github.io/imagetools/capture_canvas/index)

This example adds the counter parameter to the filename, and thus it will download 20 images. (you can set this to any positive integer value you like)
[https://josvromans.github.io/imagetools/capture_canvas/index?counter=20](https://josvromans.github.io/imagetools/capture_canvas/index?counter=20)


# Notes

- This is purely made as an example of saving images, refreshing the page, and keeping track of things using an url parameter.Some methods might be useful and can be copied and pasted in any other project you might have
- This code also takes care about adding parameters to the filename in a certain format, so that it can be used in other software (for example if you have a directory full with images and you want to sort them on certain properties)
- This [gallery tool](https://github.com/josvromans/imagetools/tree/main/image_gallery) can view the outputs filtered on their properties.
- In Chrome, you might have to give permission for multiple file download. In Firefox this works for me.
