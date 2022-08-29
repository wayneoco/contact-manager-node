/*
Summary of Classes:
- ContactsModel
- ContactsView
- ContactFormView
- SearchView
- Controller
*/

'use strict';

const BASE_URL = 'http://localhost:3000';
const API_PATH = 'api/contacts';
const API_URL = `${BASE_URL}/${API_PATH}`;

class ContactsModel {
  constructor() {}

  async getAll() {
    try {
      const response = await fetch(`${API_URL}`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('There was an error retrieving contacts.');
      }
    } catch (error) {
      return error;
    }
  }

  async getContact(contactId) {
    try {
      const response = await fetch(`${API_URL}/${contactId}`);
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Contact not found.');
      }
    } catch (error) {
      alert(error);
      return error;
    }
  }

  async addContact(contactJson) {
    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: contactJson
      });
      if (response.ok) {
        return response;
      } else {
        throw new Error('Contact not found.');
      }
    } catch (error) {
      return error;
    }
  }

  async updateContact(contactId, contactJson) {
    try {
      const response = await fetch(`${API_URL}/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: contactJson,
      });
      if (response.ok) {
        return response;
      } else {
        throw new Error('Contact not found.');
      }
    } catch (error) {
      return error;
    }
  }

  async deleteContact(contactId) {
    try {
      const response = await fetch(`${API_URL}/${contactId}`, {
         method: 'DELETE'
       });
      if (response.ok) {
        return response;
      } else {
        throw new Error('Contact not found.');
      }
    } catch (error) {
      return error;
    }
  }

  async filterByName(input) {
    const allContacts = await this.getAll();
    return allContacts.filter(({full_name}) => {
      return full_name.toLowerCase().startsWith(input.toLowerCase());
    });
  }

  async filterByTag(tag) {
    const allContacts = await this.getAll();
    return allContacts.filter(({tags}) => {
      const tagsList = tags.split(',');
      return tagsList.includes(tag);
    });
  }

  async getAllTags() {
    const allContacts = await this.getAll();
    const allTags = [];
    allContacts.forEach(({tags}) => {
      if (tags) {
        tags.split(',').forEach(tag => {
          if (!allTags.includes(tag)) {
            allTags.push(tag);
          }
        });
      }
    });
    this.allTags = allTags;
    return allTags;
  }
}

class ContactsView {
  constructor() {
    this.addButton = document.querySelector('#add-contact');
    this.searchIcon = document.querySelector('#search');
    this.container = document.querySelector('#contacts-container');
    this.tagFilterContainer = document.querySelector('#tag-filter');
    this.scripts = {};
    this.templates = document.querySelectorAll("script[data-for='contacts-view']");
    this.partials = document.querySelectorAll("script[data-for='contacts-view'][data-type='partial']");
    this.initHandlebars();
    this.allContactsScript = this.scripts['contacts'];
    this.contactCardScript = this.scripts['contact_card'];
  }

  // event listener for opening the add contact form
  bindOpenFormAdd(handler) {
    this.addButton.addEventListener('click', e => {
      e.preventDefault();
      handler();
    });
  }

  // event listener for opening the edit contact form or deleting a contact
  bindContactsContainerClickEvents(handler) {
    this.container.addEventListener('click', e => {
      e.preventDefault();
      handler(e);
    });
  }

  // event listener for opening the search interface
  bindOpenSearch(handler) {
    this.searchIcon.addEventListener('click', e => {
      e.preventDefault();
      handler();
    });
  }

  // event listener for returning to main contact view from filtered by tag view
  bindTagFilterClose(handler) {
    this.tagFilterContainer.addEventListener('click', e => {
      e.preventDefault();
      handler();
    });
  }

  renderAllContacts(contacts) {
    if (contacts.length === 0) {
      this.renderNoContactsMessage();
      return;
    }
    const contactsHTML = this.allContactsScript({ contacts: contacts });
    this.container.replaceChildren();
    this.container.insertAdjacentHTML('beforeend', contactsHTML);
  }

  renderNoContactsMessage() {
    const message = document.createElement('h3');
    message.textContent = 'There are no contacts.';
    this.container.appendChild(message);
  }

  renderContactsByTag(tag, contacts) {
    const currentHeading = document.querySelector('#tag-filter h2');
    const newHeading = document.createElement('h2');
    const close = document.createElement('a');
    this.tagFilterContainer.replaceChildren(newHeading);
    this.tagFilterContainer.appendChild(close);
    newHeading.textContent = `tag: ${tag}`;
    newHeading.setAttribute('id', `tag-${tag}`);
    close.textContent = '[X]';
    close.setAttribute('href', '#');
    this.renderAllContacts(contacts);
  }

  tagFilterClose(contacts) {
    this.tagFilterContainer.replaceChildren();
    this.renderAllContacts(contacts);
  }

  renderNewContact(contact) {
    if (this.container.firstElementChild.tagName === 'H3') {
      this.container.replaceChildren();
    }
    const contactHTML = this.contactCardScript(contact);
    this.container.insertAdjacentHTML('beforeend', contactHTML);
  }

  renderUpdatedContact(contactId, contact) {
    const parent = this.container;
    const currentContactCard = parent.querySelector(`div[id$="${contactId}"]`);
    const tempDiv = document.createElement('div');
    const updatedContactHTML = this.scripts['contact_card'](contact);
    tempDiv.innerHTML = updatedContactHTML;
    parent.replaceChild(tempDiv.firstElementChild, currentContactCard);
  }

  removeContact(element) {
    element.remove();

    if (!this.container.firstElementChild) this.renderNoContactsMessage();
  }

  formatPhone(phone) {
    if (this.isValidPhone(phone)) return phone;
    return phone.slice(0, 3) + '-' + phone.slice(3, 6) + '-' + phone.slice(6);
  }

  isValidPhone(phone) {
    return /^\d{3}-\d{3}-\d{4}$/.test(phone) || /^\d-\d{3}-\d{3}-\d{4}$/.test(phone);
  }

  initHandlebars() {
    this.templates.forEach(template => {
      this.scripts[template.id] = Handlebars.compile(template.innerHTML);
    });

    this.partials.forEach(template => {
        Handlebars.registerPartial(template.id, template.innerHTML);
    });

    Handlebars.registerHelper('split', (string) => {
      if (string) {
        return string.split(',');
      } else {
        return null;
      }
    });

    Handlebars.registerHelper('formatPhone', (phone) => {
      return this.formatPhone(phone);
    });
  }
}

class ContactFormView {
  constructor() {
    this.modal = document.querySelector('#contact-form-modal');
    this.container = this.modal.querySelector('#contact-form');
    this.header = this.container.querySelector('h3');
    this.form = this.container.querySelector('form');
    this.formInputs = this.form.querySelectorAll('input:not([type=submit])');
    this.phoneInput = this.form.querySelector('#phone_number');
    this.tagsSelect = document.querySelector('#tags');
    this.submit = this.form.querySelector('#submit');
    this.cancel = this.form.querySelector('#cancel');
  }

  bindCancelForm(handler) {
    this.cancel.addEventListener('click', e => {
      e.preventDefault();
      handler();
    });
  }

  bindSubmit(handler) {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      handler();
    });
  }

  bindInputValidation(handler) {
    this.formInputs.forEach(input => {
      input.addEventListener('blur', e => {
        handler(e);
      });
    });
  }

  bindPhoneAutoFormatKeydown(handler) {
    this.phoneInput.addEventListener('keydown', e => {
      handler(e);
    });
  }

  openFormAdd() {
    this.header.textContent = 'Create Contact';
    this.container.classList.replace('update', 'add');
    this.modal.classList.toggle('show');

    this.focusFirstNameInputOnOpen();
  }

  openFormEdit(contact) {
    this.header.textContent = 'Update Contact';
    this.container.classList.replace('add', 'update');
    this.setInputValues(contact);
    this.modal.classList.toggle('show');
    this.focusFirstNameInputOnOpen();
  }

  focusFirstNameInputOnOpen() {
    setTimeout(() => {
      this.form.querySelector('#full_name').focus();
    }, 50);
  }

  cancelForm() {
    const selectedTagsList = this.form.querySelector('#select2-tags-container');
    selectedTagsList.replaceChildren();

    this.formInputs.forEach(input => {
      input.value = '';
    });

    this.modal.classList.toggle('show');

    if (!this.form.checkValidity()) {
      this.clearInvalidInputMarkers();
    }
  }

  checkInputValidity(event) {
    const validity = event.target.checkValidity();

    if (validity) {
      if (event.target.parentElement.nextElementSibling.tagName === 'P') {
        this.clearInvalidInputMarker(event);
      }
      return;
    }

    const p = document.createElement('p');
    if (!event.target.classList.contains('invalid')) this.addInvalidInputMarkers(event, p);
  }

  addInvalidInputMarkers(event, p) {
    if (event.target.id === 'full_name') {
      p.textContent = 'Please enter a name.';
    } else if (event.target.id === 'email') {
      p.textContent = 'Please enter a valid email.';
    } else if (event.target.id === 'phone_number') {
      p.textContent = 'Please enter a valid phone number.';
    }

    event.target.parentElement.insertAdjacentElement('afterend', p);
    event.target.classList.add('invalid');
  }

  clearInvalidInputMarker(event) {
    event.target.parentElement.nextElementSibling.remove();
    event.target.classList.remove('invalid');
  }

  clearInvalidInputMarkers() {
    const text = this.form.querySelectorAll('p');
    text.forEach(text => text.remove());

    this.formInputs.forEach(input => input.classList.remove('invalid'));
  }

  // pre-populate input fields with contact data when opening 'edit contact' form
  setInputValues(contact) {
    Object.keys(contact).forEach(key => {
      const input = this.form.querySelector(`#${key}`);
      const value = contact[key];

      input.value = value;
    });
  }

  // set tag options when add/edit contact form is opened
  // also pre-selects tags when edit contact form is opened
  setTagSelectOptions(allTags = null, contactTags = null) {
    this.tagsSelect.replaceChildren();
    const updatedTags = [];

    if (allTags) {
      let selectedTags;

      if (contactTags) {
        selectedTags = contactTags.split(',');
      }

      allTags.forEach(tag => {
        const tagData = { id: tag, text: tag };

        if (selectedTags && selectedTags.includes(tag)) {
          tagData.selected = true;
        }

        updatedTags.push(tagData);
      });
    }

    // use Select2 library to implement tag selection interface
    $('.multiple-select').select2({
      placeholder: 'Select tag(s) or create a new one',
      data: updatedTags,
      tags: true,
      width: '260px'
    });
  }

  phoneAutoFormat(e) {
    if ((/[^0-9]/.test(e.key)) &&
      (e.key !== 'Backspace' && e.key !== 'Tab')) {
        e.preventDefault();
        return;
    }

    if (/^\d{4}$/.test(this.phoneInput.value)) {
      this.phoneInput.value = this.phoneInput.value.slice(0, 3) +
                          '-' +
                          this.phoneInput.value.slice(-1);
    } else if (/^\d{3}-\d{4}$/.test(this.phoneInput.value)) {
      this.phoneInput.value = this.phoneInput.value.slice(0, 7) +
                          '-' +
                          this.phoneInput.value.slice(-1);
    }
  }

  formDataToJson(formData) {
    const obj = { tags: [] };

    for (const pair of formData) {
      if (pair[0] === 'tags[]') {
        obj.tags.push(pair[1]);
      } else {
        obj[pair[0]] = pair[1];
      }
    }

    obj.tags = obj.tags.join(',');
    return JSON.stringify(obj);
  }
}

class SearchView {
  constructor() {
    this.modal = document.querySelector('#search-modal');
    this.wrapper = document.querySelector('#search-wrapper');
    this.form = this.wrapper.querySelector('#search-form');
    this.input = this.form.querySelector('input');
    this.cancelButton = this.form.querySelector('#cancel-search');
    this.resultsWrapper = this.wrapper.querySelector('#results-wrapper');
    this.resultsList = this.resultsWrapper.querySelector('ul');
    this.selectedContact = this.wrapper.querySelector('#selected-contact');
    this.scripts = {};
    this.templates = document.querySelectorAll("script[data-for='search-view']");
    this.initHandlebars();
    this.resultsScript = this.scripts['search-results'];
  }

  bindCancelSearch(handler) {
    this.cancelButton.addEventListener('click', e => {
      e.preventDefault();
      handler();
    });
  }

  bindInputChange(handler) {
    this.input.addEventListener('input', () => {
      handler();
    });
  }

  bindSelectContact(handler) {
    this.resultsList.addEventListener('click', e => {
      e.preventDefault();
      handler(e);
    });
  }

  bindEditDeleteButtons(handler) {
    this.selectedContact.addEventListener('click', e => {
      e.preventDefault();
      handler(e);
    });
  }

  initHandlebars() {
    this.templates.forEach(template => {
      this.scripts[template.id] = Handlebars.compile(template.innerHTML);
    });
  }

  openSearch() {
    this.modal.classList.toggle('show');
    setTimeout(() => {
      this.input.focus();
    }, 50);
  }

  cancelSearch() {
    this.modal.classList.toggle('show');
    if (this.form.classList.contains('dropdown')) {
      this.form.classList.toggle('dropdown');
    }
    this.resetSearchText();
    this.resultsList.replaceChildren();
    this.selectedContact.replaceChildren();
  }

  get searchText() {
    return this.input.value;
  }

  resetSearchText() {
    this.input.value = '';
  }

  resetResults() {
    if (this.form.classList.contains('dropdown')) {
      this.form.classList.toggle('dropdown');
    }
    this.resultsList.replaceChildren();
    this.selectedContact.replaceChildren();
  }

  renderResults(matches) {
    if (!this.form.classList.contains('dropdown')) {
      this.form.classList.toggle('dropdown');
    }

    const resultsHTML = this.resultsScript({ matches: matches });
    this.resultsList.innerHTML = resultsHTML;
  }

  renderNoResults() {
    const listElement = document.createElement('li');
    listElement.textContent = 'No contact found';
    this.resultsList.replaceChildren(listElement);
    this.selectedContact.replaceChildren();
    this.form.classList.toggle('dropdown');
  }

  renderContact(html) {
    this.selectedContact.innerHTML = html;
  }
}

class Controller {
  constructor() {
    this.contactsModel = new ContactsModel();
    this.contactsView = new ContactsView();
    this.contactFormView = new ContactFormView();
    this.searchView = new SearchView();
    this.init();

    this.contactsView.bindOpenFormAdd(this.handleOpenFormAdd);
    this.contactsView.bindContactsContainerClickEvents(this.handleContactsContainerClickEvents);
    this.contactsView.bindOpenSearch(this.handleOpenSearch);
    this.contactsView.bindTagFilterClose(this.handleTagFilterClose);
    this.contactFormView.bindPhoneAutoFormatKeydown(this.handlePhoneAutoFormatKeydown);
    this.contactFormView.bindInputValidation(this.handleInputValidation);
    this.contactFormView.bindCancelForm(this.handleCancelForm);
    this.contactFormView.bindSubmit(this.handleSubmit);
    this.searchView.bindCancelSearch(this.handleCancelSearch);
    this.searchView.bindInputChange(this.handleInputChange);
    this.searchView.bindSelectContact(this.handleSelectContact);
    this.searchView.bindEditDeleteButtons(this.handleContactsContainerClickEvents);
  }

  handleCancelForm =() => this.contactFormView.cancelForm();
  handlePhoneAutoFormatKeydown = (e) => this.contactFormView.phoneAutoFormat(e);
  handleOpenSearch = () => this.searchView.openSearch();
  handleCancelSearch = () => this.searchView.cancelSearch();
  handleInputValidation = (e) => this.contactFormView.checkInputValidity(e);

  handleOpenFormAdd = async () => {
    this.contactFormView.openFormAdd();
    this.contactFormView.setTagSelectOptions(await this.contactsModel.getAllTags());
  }

  handleContactsContainerClickEvents = (e) => {
    if (e.target.classList.contains('edit')) {
      this.handleOpenFormEdit(e);
    } else if (e.target.classList.contains('delete')) {
      this.handleDeleteContact(e);
    } else if (e.target.classList.contains('tag')) {
      this.handleFilterByTag(e);
    }
  }

  handleOpenFormEdit = async (e) => {
    const cardParent = e.target.closest('.card');
    const contactId = cardParent.id.split('-').at(-1);
    const contact = await this.contactsModel.getContact(contactId);

    if (contact instanceof Error === false) {
      const contactTags = contact.tags;
      this.contactFormView.openFormEdit(contact);
      this.contactFormView.setTagSelectOptions(await this.contactsModel.getAllTags(), contactTags);
    }
  }

  handleDeleteContact = async (e) => {
    const cardParent = e.target.closest('.card');
    const contactId = cardParent.id.split('-').at(-1);
    const contactName = cardParent.firstElementChild.textContent.trim();
    const confirmation = confirm(`Are you sure you want to delete ${contactName}?`);

    if (confirmation) {
      const response = await this.contactsModel.deleteContact(contactId);

      if (response.ok) {
        const container = this.contactsView.container;
        const elementToRemove = this.contactsView.container.querySelector(`#contact-${contactId}`);
        this.contactsView.removeContact(elementToRemove);

        if (this.searchView.modal.classList.contains('show')) this.searchView.cancelSearch();

        setTimeout(() => {
          alert(`${contactName} has been deleted. So sad...`);
        }, 300);
      }
    }
  }

  handleFilterByTag = async (e) => {
    const tag = e.target.dataset.tag;
    const filteredContacts = await this.contactsModel.filterByTag(tag);
    this.contactsView.renderContactsByTag(tag, filteredContacts);
    if (this.searchView.modal.classList.contains('show')) this.searchView.cancelSearch();
  }

  handleTagFilterClose = async () => {
    const allContacts = await this.contactsModel.getAll();
    this.contactsView.tagFilterClose(allContacts);
  }

  handleSubmit = () => {
    const container = this.contactFormView.container;
    const formData = new FormData(this.contactFormView.form);
    const contact = this.contactFormView.formDataToJson(formData);
    const contactId = JSON.parse(contact).id.split('-').at(-1);
    const contactName = JSON.parse(contact)['full_name'];

    if (this.contactFormView.form.checkValidity()) {
      if (container.classList.contains('add')) {
        this.handleAddContact(contact, contactName);
      } else if (container.classList.contains('update')) {
        this.handleUpdateContact(contact, contactId, contactName);
      }
    } else {
      this.dispatchBlurEventOnSubmit();
    }
  }

  dispatchBlurEventOnSubmit = () => {
    this.contactFormView.formInputs.forEach(input => {
      if (input.id !== 'id') {
        const blur = new Event('blur');
        input.dispatchEvent(blur);
      }
    });
  }

  async handleAddContact(contactData, contactName) {
    const response = await this.contactsModel.addContact(contactData);

    if (response.ok) {
      const contact = await response.json();
      this.contactsView.renderNewContact(contact);
      this.contactFormView.cancelForm();
      setTimeout(() => {
        alert(`Contact ${contactName} has been added.`);
      }, 300);
    } else {
      alert(`Error: ${response.message}`);
    }
  }

  async handleUpdateContact(contactData, contactId, contactName) {
    const response = await this.contactsModel.updateContact(contactId, contactData);

    if (response.ok) {
      const contact = await response.json();
      this.contactsView.renderUpdatedContact(contactId, contact);
      this.contactFormView.cancelForm();

      if (this.searchView.modal.classList.contains('show')) this.searchView.cancelSearch();

      if (document.querySelector('#tag-filter').firstElementChild) {
        const tag = document.querySelector('#tag-filter').firstElementChild.id.split('-').at(-1);
        const filteredContacts = await this.contactsModel.filterByTag(tag);
        this.contactsView.renderContactsByTag(tag, filteredContacts);
      }

      setTimeout(() => {
        alert(`Contact ${contactName} has been updated.`);
      }, 300);
    } else {
      alert(`Error: ${response.message}`);
    }
  }

  handleInputChange = async () => {
    const input = this.searchView.searchText;
    if (input.length < 1) {
      this.searchView.resetResults();
      return;
    }

    const matches = await this.contactsModel.filterByName(input);

    if (matches.length > 0) {
      this.searchView.renderResults(matches);
    } else {
      this.searchView.renderNoResults();
    }
  }

  handleSelectContact = async (e) => {
    if (e.target.tagName === 'A') {
      const contactId = e.target.dataset.id;
      const contact = await this.contactsModel.getContact(contactId);
      const html = this.contactsView.contactCardScript(contact);
      this.searchView.renderContact(html);
    }
  }

  async initialContactsRender() {
    const allContacts = await this.contactsModel.getAll();
    this.contactFormView.setTagSelectOptions();
    this.contactsView.renderAllContacts(allContacts);
  }

  async init() {
    await this.initialContactsRender();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new Controller();
});
