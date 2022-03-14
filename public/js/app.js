/* Name: Kaitlin Peng
   Course: CS 193X
   Instructor: Michael Chang */

import Gallery, { GalleryItem } from "./Gallery.js";

class App {
  constructor() {
    this._gallery = null;
    this._home = null;
    this._galleryForm = null;
    this._new = null;
    this._itemForm = null;
    this._chooseFile = null;
    this._uploadedURL = null;  // data URL for new uploaded item
    this._closeModal = null;
    this._notes = null;

    this._onHome = this._onHome.bind(this);
    this._onAddGallery = this._onAddGallery.bind(this); 
    this._onChangeGallery = this._onChangeGallery.bind(this); 
    this._onEditGallery = this._onEditGallery.bind(this);
    this._onDeleteGallery = this._onDeleteGallery.bind(this);
    this._onAddItem = this._onAddItem.bind(this);
    this._onSelectFile = this._onSelectFile.bind(this);
    this._onSubmitItem = this._onSubmitItem.bind(this);
    this._onCloseModal = this._onCloseModal.bind(this);
    this._onItemDescEdit = this._onItemDescEdit.bind(this);
    this._onDeleteItem = this._onDeleteItem.bind(this);
    this._onNotesEdit = this._onNotesEdit.bind(this);
  }

  async setup() {
    this._home = document.querySelector("#home");                // home button
    this._galleryForm = document.querySelector("#galleryForm");  // add gallery
    this._new = document.querySelector("#new");                  // new button
    this._itemForm = document.querySelector("#itemForm");        // add item
    this._chooseFile = document.querySelector("#itemUpload");    // upload file button
    this._closeModal = document.querySelector(".close");         // close modal button
    this._notes = document.querySelector("#notes");              // notes section

    this._home.addEventListener("click", this._onHome);
    this._galleryForm.addEventListener("submit", this._onAddGallery); 
    this._new.addEventListener("click", this._onAddItem);
    this._chooseFile.addEventListener("change", this._onSelectFile);
    this._itemForm.addEventListener("submit", this._onSubmitItem); 
    this._closeModal.addEventListener("click", this._onCloseModal);
    this._notes.addEventListener("change", this._onNotesEdit);

    await this._loadSidebar();
  }

  async _loadSidebar() { 
    // display as sidebar loads
    document.querySelector("#galleries").textContent = "Loading...";

    let galleries = await Gallery.getAllGalleries();
    document.querySelector("#galleries").textContent = "";
    for (let gallery of galleries) {
      this._displayGallerySide(gallery);
    }  
  }

  _displayGallerySide(gallery) {
    if (!(gallery instanceof Gallery)) throw new Error("displayGallerySide wasn't passed a Gallery object"); 

    let newGalleryLink = document.querySelector(".template.galleryLink").cloneNode(true);
    newGalleryLink.addEventListener("click", this._onChangeGallery);
    newGalleryLink.querySelector("span").textContent = gallery.title;

    let newButtons = newGalleryLink.querySelector(".editDelete");
    newButtons.querySelector(".edit").addEventListener("click", this._onEditGallery);
    newButtons.querySelector(".delete").addEventListener("click", this._onDeleteGallery);
    
    newGalleryLink.classList.remove("template");
    document.querySelector("#galleries").appendChild(newGalleryLink); 
  } 

  _highlightGallery() {
    // highlight current gallery and unhighlight other galleries
    for (let gallery of document.querySelectorAll(".galleryLink")) {
      if (gallery.querySelector("span").textContent === this._gallery.title) {
        gallery.style.backgroundColor = "#e7c8c8";
      } else {
        gallery.style.backgroundColor = "";
      }
    }
  }

  async _loadContent() { 
    // display as content loads
    document.querySelector("#allItems").textContent = "Loading...";

    if (!this._gallery) {  // return to home page
      document.querySelector("#galleryTitle").textContent = "Home"; 
      this._new.style.display = "none";
      this._notes.style.display = "none";
      document.querySelector("#message").style.display = "block";
      document.querySelector("#allItems").textContent = "";
    } else {  // load current gallery's items and notes
      document.querySelector("#galleryTitle").textContent = this._gallery.title; 
      document.querySelector("#message").style.display = "none";
      this._notes.querySelector("#notesContent").value = this._gallery.notes;
      this._notes.style.display = "block";
      this._new.style.display = "inline-flex";

      // Load items
      let board = await this._gallery.getItems();
      document.querySelector("#allItems").textContent = "";
      for (let item of board) {
        this._displayItem(item);
      } 
    }
  }

  _displayItem(item) {
    if (!(item instanceof GalleryItem)) throw new Error("displayItem wasn't passed a GalleryItem object"); 

    let newItem;
    // clone template based on what type the item is
    if (item.type === "image") {
      newItem = document.querySelector(".template.galleryImage").cloneNode(true);
      newItem.querySelector(".itemImage").src = item.path;
      newItem.alt = item.title;
    } else if (item.type === "video") {
      newItem = document.querySelector(".template.galleryVideo").cloneNode(true);
      newItem.querySelector(".itemVideo").src = item.path;
      newItem.alt = item.title;
    } else if (item.type === "youtube") {
      newItem = document.querySelector(".template.galleryYoutube").cloneNode(true);
      newItem.querySelector(".itemYoutube").src = item.path;
    } else if (item.type === "spotify") {
      newItem = document.querySelector(".template.gallerySpotify").cloneNode(true);
      newItem.querySelector(".itemSpotify").src = item.path;
    }

    // set title/description and add button event listener
    newItem.querySelector(".itemTitle").textContent = item.title;
    let desc = newItem.querySelector(".itemDescription");
    desc.value = item.description;
    desc.addEventListener("change", this._onItemDescEdit);
    newItem.querySelector(".delete").addEventListener("click", this._onDeleteItem);
    
    newItem.classList.remove("template");
    document.querySelector("#allItems").append(newItem);
  } 

  /* Event handlers */
  async _onHome() {
    this._gallery = null;
    await this._loadSidebar();
    await this._loadContent();
  }

  async _onAddGallery(event) {
    event.preventDefault();

    let input = document.querySelector("#inputTitle").value;
    try {
      this._gallery = await Gallery.createGallery(input);
    } catch(e) {
      alert(`ERROR ${e.status}: ${e.message}`);
      return;
    }
    this._galleryForm.querySelector("#inputTitle").value = "";  // clear input

    await this._loadSidebar();
    this._highlightGallery();
    await this._loadContent();
  } 

  async _onChangeGallery(event) {
    let gallery = event.currentTarget.querySelector("span").textContent;
    this._gallery = await Gallery.getGallery(gallery);
    this._highlightGallery();
    await this._loadContent();
  }

  async _onEditGallery(event) {
    let gallery = event.currentTarget.parentNode.parentNode.querySelector("span").textContent;
    let newTitle = prompt("Please enter the new gallery name:", gallery);
    if (newTitle === null) {
      return;
    }

    this._gallery = await Gallery.getGallery(gallery); 
    try {
      await this._gallery.editGallery(newTitle); 
      this._gallery.title = newTitle;
    } catch(e) {
      alert(`ERROR ${e.status}: ${e.message}`);
      return;
    }
    
    await this._loadSidebar();
    this._highlightGallery();
    await this._loadContent();
  }

  async _onDeleteGallery(event) {
    let gallery = event.currentTarget.parentNode.parentNode.querySelector("span").textContent;
    
    if (confirm(`Are your sure you want to delete "${gallery}"?`)) {
      this._gallery = await Gallery.getGallery(gallery); 
      await this._gallery.deleteGallery();
      this._onHome();
    }
  }

  _onAddItem() {
    document.querySelector("#addModal").style.display = "block";  // show add item modal
  }

  // Citation: code from assignment 2 import_export.js
  _onSelectFile(event) {
    let file = event.currentTarget.files[0];
    if (!file) {
      this._uploadedURL = null;
      return;
    }
    let reader = new FileReader();
    reader.addEventListener("error", (event) => {
      throw new Error("Error reading file");
    });
    reader.addEventListener("load", (event) => {
      this._uploadedURL = reader.result;
    });
    reader.readAsDataURL(file);
  }

  async _onSubmitItem(event) {
    event.preventDefault();

    let data = {
      "title": this._itemForm.querySelector("#newItemTitle").value,
      "description": this._itemForm.querySelector("#newItemDescription").value,
      "path": this._uploadedURL
    };
    if (this._itemForm.querySelector("#link").checked) {
      data.path = this._itemForm.querySelector("#itemLink").value;
    }

    try {
      await this._gallery.addItem(data);
    } catch(e) {
      alert(`ERROR ${e.status}: ${e.message}`);
      return;
    }

    this._uploadedURL = null;
    this._onCloseModal();
    await this._loadContent();
  }

  _onCloseModal() {
    this._itemForm.querySelector("#newItemTitle").value = "";
    this._itemForm.querySelector("#newItemDescription").value = "";
    this._itemForm.querySelector("#itemUpload").value = "";
    this._itemForm.querySelector("#itemLink").value = "";
    this._itemForm.querySelector("#upload").checked = true;
    document.querySelector("#addModal").style.display = "none";
  }

  async _onItemDescEdit(event) {
    for (let item of this._gallery.items) {
      if (item.title === event.currentTarget.parentNode.querySelector(".itemTitle").textContent) {
        item.description = event.currentTarget.value;
        await this._gallery.save();
        break;
      }
    }
  }

  async _onDeleteItem(event) {
    let item = event.currentTarget.parentNode.parentNode.querySelector(".itemTitle").textContent;
    await this._gallery.deleteItem(item);
    await this._loadContent();
  }

  async _onNotesEdit() {
    this._gallery.notes = this._notes.querySelector("#notesContent").value;
    await this._gallery.save();
  }
}

let app = new App();
app.setup();
