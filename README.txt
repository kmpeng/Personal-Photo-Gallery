#Personal Photo Gallery

##Overview
--------
This project was originally started as my final project in CS 193X. It is an image/video/song gallery where you can create galleries and upload images, videos and songs to them. 
All gallery items are annotatable with a title [required, unchangeable] and description [optional, changeable], and you can also make general annotations about the gallery 
itself in the notes section to the right of the gallery. Items that can be added to the gallery include images/videos uploaded from your computer, images/videos from a URL, 
YouTube URLs, and Spotify tracks/albums through their URL. Other features of this application include the ability to delete whole galleries, deleting individual gallery items,
and renaming galleries.
If you need help with the application, the home page has visual examples of all the features!

##Running
-------
The project is being hosted on https://cs193x-finalproject.herokuapp.com/gallery.html

##Features
--------
- Creating different galleries
- Editing gallery names
- Deleting galleries
- Each gallery has a notes section that you can edit
- Adding items to a gallery with a title (required) and description (optional)
	- items that can be added include...
		- images/videos from your computer 
		- images/videos from a URL
		- YouTube URLs
		- Spotify tracks/albums through a URL
- Deleting items from a gallery
- Home button that brings you to a welcome page that explains how the application works
All of these features (with visual examples) are described on the home page

##Collaboration and libraries
---------------------------
- https://www.ankursheel.com/blog/full-width-you-tube-video-embed for help with making my embeded YouTube videos take up the whole width of the containers they are in
- https://www.w3schools.com/howto/howto_css_modals.asp for help with creating the "item creation" modal that displays when the "New" button is clicked
- https://stackoverflow.com/questions/11225912/make-div-height-occupy-parent-remaining-height/11226029#11226029 for help with making the notes section fit on the screen correctly
- https://stackoverflow.com/questions/28735459/how-to-validate-youtube-url-in-client-side-in-text-box for help with checking if a URL is a YouTube link
- https://stackoverflow.com/questions/21607808/convert-a-youtube-video-url-to-embed-code for help with converting a YouTube link into its embedded link
- https://stackoverflow.com/a/64866894 for help with checking if a URL is a Spotify link and converting it into its embedded link
- https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Two+Tone|Material+Icons+Round|Material+Icons+Sharp for icons that are used 
  in the edit/delete/new buttons
