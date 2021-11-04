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

function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }}

function getMaxDate(ob_arr) {
  var dates = [];

  for(i=0; i < ob_arr.length; i++){
    dates.push(new Date(ob_arr[i].effectiveDateTime))
  }
  
  return new Date(Math.max.apply(null, dates));
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

      console.log("weight:" + getQuantityValueAndUnit(weight[0]))
       
      for (i=0; i < weight.length; i++){
        console.log(getMaxDate(weight))
        console.log("test" + weight[i].effectiveDateTime)
        if (new Date(weight[i].effectiveDateTime) == getMaxDate(weight)){
          console.log(weight[i])
        }
      }
      console.log(ob)
      // create patient object
      var p = defaultPatient();

     
      // set patient value parameters to the data pulled from the observation resoruce
    

    });
  }).catch(console.error);
