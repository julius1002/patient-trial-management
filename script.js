import { fromEvent, map, switchMap, from, debounceTime } from "https://esm.sh/rxjs";

const clinicalTrialsQueryCondUrl = "https://clinicaltrials.gov/api/v2/studies?pageSize=5&query.cond=";

const randomUsersUrl = "https://randomuser.me/api/?results=20";

const illnessSearchInput = document.getElementById("illness-search");

const illnessSearchInput$ = fromEvent(illnessSearchInput, "keyup");

const foundStudies = document.getElementById("found-studies");

const patientGrid = document.getElementsByClassName("patient-grid")[0];

function addStudy(studyObj) {
	const study = document.createElement("li");
	const div = document.createElement("div");
	const studyNameElem = document.createElement("p");
	studyNameElem.textContent = studyObj.protocolSection.identificationModule.briefTitle;
	const placeNameElem = document.createElement("p");
	console.log(studyObj);
	placeNameElem.textContent = studyObj.protocolSection.identificationModule.organization.fullName;
	div.appendChild(studyNameElem);
	div.appendChild(placeNameElem);

	study.appendChild(div);
	foundStudies.appendChild(study);
}

// illnessSearchInput$.subscribe(event => { console.log("input!", event.target.value); });
illnessSearchInput$.pipe(
		map(event => event.target.value),
		debounceTime(600),
		switchMap(input => from(fetch(clinicalTrialsQueryCondUrl + input).then(response => response.json()))),
		map(data => data.studies),
	  ).subscribe(studies => { studies.forEach(study => { addStudy(study) }) });

function addPatient(name, conditions, phone, mail, imgUrl) {
	const newPatient = document.createElement("div");
	newPatient.setAttribute("class", "patient");

	const patientImg = document.createElement("img");
	patientImg.src = imgUrl;
	newPatient.appendChild(patientImg);

	const patientName = document.createElement("h5");
	patientName.textContent = name;
	newPatient.appendChild(patientName);

	const patientConditions = document.createElement("p");
	patientConditions.textContent = "Conditions: " + conditions.join(", ");
	newPatient.appendChild(patientConditions);

	const phoneElem = document.createElement("p");
	phoneElem.textContent = "Phone: " + phone;
	newPatient.appendChild(phoneElem);

	const mailElem = document.createElement("p");
	mailElem.textContent = "Mail: " + mail;
	newPatient.appendChild(mailElem);

	const assignBtn = document.createElement("button");
	assignBtn.textContent = "Assign to selected trial";
	newPatient.appendChild(assignBtn);

	patientGrid.appendChild(newPatient);
}

from(fetch(randomUsersUrl).then(response => response.json()))
	.pipe(map(response => response.results))
	.subscribe(results => 
			{ results.forEach(result => { 
					const fullName = result.name.title + ". " + result.name.first + " " + result.name.last;
					addPatient(fullName, ["Colon Cancer", "Diabetes"], result.phone, result.email, result.picture.medium);
			})
		});
