function getPatientName(pt) {
  
    if (pt.name) {
      var names = pt.name.map(function(name) {
        return name.given.join(" ") + " " + name.family; 
        })
      return names.join(" / ")
    } else {
      return "anonymous";
  }
}


function displayPatient(pt) {
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
    document.getElementById('gender').innerHTML = pt.gender;
    document.getElementById('dob').innerHTML = pt.birthDate;
    console.log("Patient Name " + getPatientName(pt))
}

function defaultPatient() {
    return {
      flu_vaccine: {
        value: ''
      },
      weight: {
        value:''
      },
      note: 'No Annotation',
    };
}


FHIR.oauth2.ready().then(function(client) {
  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${client.patient.id}`).then(
    function(patient) {
      displayPatient(patient);
      //console.log(patient);
    }
  );
  // get observation resoruce values
  // you will need to update the below to retrive the weight and height values
  var query = new URLSearchParams();

  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|58131-4', 
    'http://loinc.org|72058-1',
    'http://loinc.org|29463-7',
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {
      // group all of the observation resoruces by type into their own
      var byCodes = client.byCodes(ob, 'code');
      var flu_vaccine = byCodes('72058-1');
      var weight = byCodes('29463-7');
      console.log("weight:" +weight)
      // create patient object
      var p = defaultPatient();

      console.log("test"+byCodes('29463-7'));
      // set patient value parameters to the data pulled from the observation resoruce
    

    });
  }).catch(console.error);
