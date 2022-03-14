/* Name: Kaitlin Peng
   Course: CS 193X
   Instructor: Michael Chang */

import apiRequest, { HTTPError } from "./api.js";

export class GalleryItem {
  // data is the item data from the API
  constructor(data) {
    this.title = data.title;
    this.description = data.description;
    this.path = data.path;
    this.type = data.type;
  }
}

export default class Gallery {
  constructor(data) {
    this.title = data.title;
    this.notes = data.notes;
    this.items = data.items;
  }

  /* returns an Object containing only the public instances variables (i.e. the ones sent to the API). */
  toJSON() {
    let data = {
      "title": this.title,
      "notes": this.notes,
      "items": this.items
    };
    return data;
  }
  
  static async createGallery(title) {
    title = title.trim();
    let data = {
      "title": title,
      "notes": "",
      "items": []
    };

    let newGallery = new Gallery(data);
    await apiRequest("POST", "/galleries", data);
    return newGallery;
  }

  static async getGallery(title) {
    let data = await apiRequest("GET", `/galleries/${title}`);
    let gallery = new Gallery(data);
    return gallery;
  }

  static async getAllGalleries() {
    let galleries = await apiRequest("GET", "/galleries");
    let galleriesArray = [];
    for (let gallery of galleries.galleries) {
      galleriesArray.push(new Gallery(gallery));
    } 
    return galleriesArray;
  }

  /* change gallery's name */
  async editGallery(newTitle) {
    newTitle = newTitle.trim();
    if (!newTitle) {
      throw new HTTPError(400, "Please put at least one character in the gallery name");
    } 

    let data = this.toJSON();
    data.title = newTitle;
    await apiRequest("PATCH", `/galleries/${this.title}`, data);
  }

  async deleteGallery() {
    await apiRequest("DELETE", `/galleries/${this.title}`);
  }

  async getItems() {
    let items = await apiRequest("GET", `/galleries/${this.title}/items`); 
    let board = [];
    for (let item of items.items) {
      board.push(new GalleryItem(item));
    }
    return board;
  }

  async addItem(data) {
    data.title = data.title.trim();
    if (!data.title) {
      throw new HTTPError(400, "Please put at least one character in the item name");
    } 

    // set type according to what the item is and update path if needed
    if (!data.path) {
      throw new HTTPError(400, "Please upload a file/enter a URL");
    } else if (data.path.includes("image") || data.path.match(/\.(jpeg|jpg|gif|png|svg)$/)) {
      data.type = "image";
    } else if (data.path.includes("video") ||  data.path.match(/\.(mp4|webm|ogg)$/)) {
      data.type = "video";
    } else if (/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/.test(data.path)) {  
      // if condition ^^ citation: https://stackoverflow.com/questions/28735459/how-to-validate-youtube-url-in-client-side-in-text-box
      
      // Citation: https://stackoverflow.com/questions/21607808/convert-a-youtube-video-url-to-embed-code
      let match = data.path.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      if (match && match[2].length == 11) {
        data.path = "https://www.youtube.com/embed/" + match[2];  // update URL to embeded URL
      } else {
        throw new HTTPError(400, "That YouTube URL is not supported");
      }
      data.type = "youtube";
    } else if (/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.test(data.path)) {
      // if condition ^^ and match citation: https://stackoverflow.com/a/64866894
      let match = data.path.match(/^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(album|track)(?::|\/)((?:[0-9a-zA-Z]){22})/);
      if (match) {
        data.path = "https://open.spotify.com/embed/" + match[1] + "/" + match[2];  // update URL to embeded URL
      } else {
        throw new HTTPError(400, "That Spotify URL is not supported");
      }
      data.type = "spotify"; 
    } else {
      throw new HTTPError(400, "That type is not supported.\n\ \n\
      Supported types: .png, .jpg, .jpeg, .gif, .svg,\n\
      .mp4, .webm, .ogg, \n\
      YouTube URLs, Spotify URLs");
    }
    
    try {
      await apiRequest("POST", `/galleries/${this.title}/items`, data);
    } catch(e) {
      if (!e.status) {
        throw new HTTPError(413, "File is too large");
      }
      throw new HTTPError(e.status, e.message);
    }

    await this._reload();
  }
  
  async deleteItem(itemTitle) {
    await apiRequest("DELETE", `/galleries/${this.title}/${itemTitle}`);
    await this._reload();
  }

  /* save the current state of the gallery to the server */
  async save() {
    let data = this.toJSON();
    await apiRequest("PATCH", `/galleries/${this.title}/content`, data);
    await this._reload();
  }

  /* reload the gallery from the API */
  async _reload() {
    let data = await apiRequest("GET", `/galleries/${this.title}`);
    Object.assign(this, data);
  }
}