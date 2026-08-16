import { fromEvent, map, switchMap, from, debounceTime, of } from "https://esm.sh/rxjs";

// if this is enabled, the same users will be fetched all the time
const useMockData = true;

// here starts a large object, that holds some mockdata. In order to not fetch the randomuser api all the time.

const mockData = undefined;

const clinicalTrialsQueryCondUrl = "https://clinicaltrials.gov/api/v2/studies?pageSize=15&query.cond=";

const randomUsersUrl = "https://randomuser.me/api/?results=20";

const illnessSearchInput = document.getElementById("illness-search");

const illnessSearchInput$ = fromEvent(illnessSearchInput, "keyup");

const foundStudies = document.getElementById("found-studies");

const patientGrid = document.getElementsByClassName("patient-grid")[0];

var selectedStudy = undefined;

function addStudy(studyObj) {
	const study = document.createElement("li");
	study.addEventListener("click", function(event) { 
						if(selectedStudy) {
							selectedStudy.removeAttribute("class", "selected"); 
						}
						study.setAttribute("class", "selected"); 
						selectedStudy = study; 
					     });
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

	const assignBtnDiv = document.createElement("div");

	assignBtnDiv.textContent = "Assign to selected trial";
	newPatient.appendChild(assignBtnDiv);

	patientGrid.appendChild(newPatient);
}


(!useMockData || !mockData ? from(fetch(randomUsersUrl).then(response => response.json())) : of(mockData))
	.pipe(map(response => response.results))
	.subscribe(results => 
			{ results.forEach(result => { 
					const fullName = result.name.title + ". " + result.name.first + " " + result.name.last;
					addPatient(fullName, ["Colon Cancer", "Diabetes"], result.phone, result.email, result.picture.medium);
			})
		});
