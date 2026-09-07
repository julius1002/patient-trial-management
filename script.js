import { fromEvent, map, switchMap, from, debounceTime, of } from "https://esm.sh/rxjs";

// if this is enabled, the same users will be fetched all the time
const useMockData = false;

// here starts a large object, that holds some mockdata. In order to not fetch the randomuser api all the time.

const mockData = {};

const clinicalTrialsQueryCondUrl = "https://clinicaltrials.gov/api/v2/studies?pageSize=15&query.cond=";

const randomUsersUrl = "https://randomuser.me/api/?results=20";

const illnessSearchInput = document.getElementById("illness-search");

const illnessSearchInput$ = fromEvent(illnessSearchInput, "keyup");

const foundStudies = document.getElementById("found-studies");

const patientGrid = document.getElementsByClassName("patient-grid")[0];

var selectedStudy = undefined;
var selectedStudyTitle = "";

var state = { studyToPatients : [] };

function addStudy(studyObj) {
	if(state.studyToPatients.length == 0) {
		document.getElementById("report-btn").classList.remove("invisible");
	}
	const study = document.createElement("li");
	study.addEventListener("click", function(event) { 
	  		if(selectedStudy) {
	  			selectedStudy.removeAttribute("class", "selected"); 
	  		}
	  		study.setAttribute("class", "selected"); 
	  		selectedStudy = study; 
	  		selectedStudyTitle = event.target.innerText;
	  	}
	);
	const div = document.createElement("div");
	const studyNameElem = document.createElement("p");
        const briefTitle = studyObj.protocolSection.identificationModule.briefTitle
	state.studyToPatients.push({ name: briefTitle, patients : [] });
	
	studyNameElem.textContent = briefTitle;
	const placeNameElem = document.createElement("p");
	placeNameElem.textContent = studyObj.protocolSection.identificationModule.organization.fullName;
	div.appendChild(studyNameElem);
	div.appendChild(placeNameElem);
	study.appendChild(div);
	foundStudies.appendChild(study);
	const assignedParticipantDiv = document.createElement("div");
	const assignedParticipantTitle = document.createElement("h4");
	assignedParticipantTitle.textContent = "Assigned patients (name, phone)";
	assignedParticipantDiv.appendChild(assignedParticipantTitle);
	study.appendChild(assignedParticipantDiv);
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

	const patientName = document.createElement("h3");
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
	assignBtnDiv.setAttribute("class", "assign-btn");

	assignBtnDiv.textContent = "Assign to selected clinical trial";
	assignBtnDiv.addEventListener("click", (event) => {
			const patientDiv = event.target.parentNode;
			const assignedParticipantList = document.createElement("ul");
			const assignedParticipant = document.createElement("li");
			const nameAndPhone = name + ", " + phone

			assignedParticipant.textContent = nameAndPhone;
			assignedParticipantList.appendChild(assignedParticipant);
			selectedStudy.appendChild(assignedParticipantList);
			var studyIndex = Array.prototype.indexOf.call(foundStudies.childNodes, selectedStudy)
			state.studyToPatients[studyIndex].patients.push(nameAndPhone);

			const studiesForPatientDiv = document.createElement("div");
			const studiesForPatientDescription = document.createElement("p");
			studiesForPatientDescription.textContent = "Assigned to studies:";
			studiesForPatientDiv.appendChild(studiesForPatientDescription);

			const studiesForPatient = document.createElement("ul");
			const studyTitle = document.createElement("li");
			studyTitle.textContent = selectedStudyTitle;
			studiesForPatient.appendChild(studyTitle);
			studiesForPatientDiv.appendChild(studiesForPatient);

			patientDiv.appendChild(studiesForPatientDiv);
		}
	);
	newPatient.appendChild(assignBtnDiv);
	patientGrid.appendChild(newPatient);
}

function createReport() {
	console.log(state);
	var output = "study,patient" + "\n";
	state.studyToPatients.forEach(studyToPatient => {
			if(studyToPatient.patients.length > 0) {
				 output += studyToPatient.name + ";" + "";
			         output += "\"" + studyToPatient.patients.join(';') + "\"\n";
			}
		});

	const blob = new Blob([output], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "data.csv";
	a.click();
	URL.revokeObjectURL(url);
}

document.getElementById("report-btn").addEventListener("click", createReport); 

(!useMockData || !mockData ? from(fetch(randomUsersUrl).then(response => response.json())) : of(mockData))
	.pipe(map(response => response.results))
	.subscribe(results => { 
		results.forEach(result => { 
		const fullName = result.name.title + ". " + result.name.first + " " + result.name.last;
		addPatient(fullName, ["Anxiety", "Diabetes"], result.phone, result.email, result.picture.medium);
		})
	});
