function getPatientName(pt) {
    console.log(pt.name);
    for(i=0; i < pt.name.length; i++){
      if(pt.name[i].use == 'official'){
        return pt.name[i].given + ' ' + pt.name[i].family
      }
    }
    //if (pt.name) {
    //  var names = pt.name.map(function(name) {
    //    return name.given.join(" ") + " " + name.family; 
    //    })
    //  return names.join(" / ")
    //} else {
    //  return "anonymous";
   //}
}


function displayPatient(pt) {
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
   // document.getElementById('gender').innerHTML = pt.gender;
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

function getMaxValue(max_date, ob_arr) {
  console.log(max_date)
  
  for(i=0; i < ob_arr.length; i++){
    if(new Date(ob_arr[i].effectiveDateTime).getTime() == max_date.getTime()){
      return getQuantityValueAndUnit(ob_arr[i])
    }
  }
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
    'http://loinc.org|82593-5',
    'http://loinc.org|55018-6',
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {
      // group all of the observation resoruces by type into their own
      var byCodes = client.byCodes(ob, 'code');
      var flu_vaccine = byCodes('72058-1');
      var flu_vaccine1 = byCodes('55018-6');
      var weight = byCodes('29463-7');
      var vaccines = byCodes('82593-5');

      console.log(ob)
      // create patient object
      var p = defaultPatient();

      //TO-DO: Finish obtaining latest weight and display
      //console.log("weight:" + getQuantityValueAndUnit(weight[0]))
      console.log(getMaxValue(getMaxDate(weight), weight))
      
      
      //Display data 
      document.getElementById('weight').innerHTML = weight;
      document.getElementById('flu_vaccine').innerHTML = flu_vaccine1;
   
      

     
      // set patient value parameters to the data pulled from the observation resoruce
    

    });
  }).catch(console.error);
