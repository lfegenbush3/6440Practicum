function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

function displayPatient(pt) {
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
    document.getElementById('gender').innerHTML = pt.gender;
    document.getElementById('dob').innerHTML = pt.birthDate;
  }
  
FHIR.oauth2.ready().then(function(client) {

    // get patient object and then display its demographics info in the banner
    client.request(`Patient/${client.patient.id}`).then(
      function(patient) {
        displayPatient(patient);
        console.log(patient);
      }
    )
}
)