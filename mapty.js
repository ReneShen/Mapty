"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

//////////////////////////////////////////
// Workout

// Workout class
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //km
    this.duration = duration; //min.
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  //API(public interface)
  click() {
    this.clicks++;
  }
}

//////////////////////////////////////////
// Running

// Running class(extends and super)
class Running extends Workout {
  type = `running`;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //  min/km
    this.pace = +this.duration / +this.distance;
    return this.pace;
  }
}

//////////////////////////////////////////
// Cycling

// Cycling class(extends and super)
class Cycling extends Workout {
  type = `cycling`;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //  km/h
    this.speed = +this.distance / +this.duration / 60;
    return this.speed;
  }
}

//////////////////////////////////////////
// App

// App class
class App {
  //a. declare the properties for ALL App class' event handlers to access
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  //b. constructor(){}
  constructor() {
    //Get user's location
    this._getPosition();

    //Data storage(local)
    this._getLocalData();

    //Add event handlers:
    form.addEventListener(`submit`, this._newWorkout.bind(this));
    inputType.addEventListener(`change`, this._toggleElevationField);
    containerWorkouts.addEventListener(`click`, this._moveToMap.bind(this));
  }

  //c. behaviors/methods
  _getPosition() {
    //Geolocation property
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Cannot access currenct location.`);
        }
      );
    }
  }

  _loadMap(position) {
    //get current position using latitude and longitude
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // declare coords
    const coords = [latitude, longitude];

    // change default leaflet data to user's current location and how much to zoom in
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Whenever clicking the map:
    this.#map.on(`click`, this._showForm.bind(this));

    //render map marker for stored data
    this.#workouts.forEach((workout) => this._renderWorkoutMarker(workout));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }

  _hideForm() {
    //hide form
    form.style.display = `none`;
    form.classList.add(`hidden`);
    setTimeout(() => (form.style.display = `grid`), 1000);

    // clear input datas on form whenever submitted one
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = ``;
  }

  _toggleElevationField() {
    //change cadence and elevation based on the type(running or bicycing)
    inputCadence.closest(`.form__row`).classList.toggle(`form__row--hidden`);
    inputElevation.closest(`.form__row`).classList.toggle(`form__row--hidden`);
  }

  _newWorkout(e) {
    e.preventDefault();

    // Helper functions
    const isNumber = (...input) => input.every((inp) => Number.isFinite(inp));
    const isPositive = (...input) => input.every((inp) => inp > 0);

    //variables
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;

    // If input type is running or cycling...
    if (type === `running`) {
      const cadence = +inputCadence.value;
      //guard clause
      if (
        !isNumber(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert(`Need a positive number`);
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === `cycling`) {
      const elevation = +inputElevation.value;
      //guard clause
      if (
        !isNumber(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert(`Need a positive number`);
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    // Render workout marker on map
    this._renderWorkoutMarker(workout);
    // Render workout on list
    this._renderWorkout(workout);
    // Clear input datas on form whenever submitted one
    this._hideForm();
    // Store #workouts array into local storage
    this._setLocalData();
  }

  _renderWorkoutMarker(workout) {
    // Displaying markers on map
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === `running`)
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${+workout.pace.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;

    if (workout.type === `cycling`)
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${+workout.speed.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToMap(e) {
    //declare the clicked element
    const workoutEl = e.target.closest(`.workout`);

    //gaurd clause
    if (!workoutEl) return;

    //declare which workout is the clicked element
    const workout = this.#workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    );

    //move to map location based on workout
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  //Data storage through API
  _setLocalData() {
    //API property and method: setItem(keyStr,valueStr), show in application storage.
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  }
  _getLocalData() {
    //API property and method: getItem(keyStr)
    const data = JSON.parse(localStorage.getItem(`workouts`));

    //gaurd clause
    if (!data) return;

    //Display stored data on form list once page loaded
    this.#workouts = data;
    this.#workouts.forEach((workout) => this._renderWorkout(workout));
  }

  //API methods
  //deleting all data in local storage
  reset() {
    localStorage.removeItem(`workouts`);
    location.reload(); //browser method
  }
}

// create instance object of App class
const app = new App();
