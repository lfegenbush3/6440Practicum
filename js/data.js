//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4 + CS6440 Lab4

function getPatientName(pt) {
    //console.log(pt.name);
    for(i=0; i < pt.name.length; i++){
      if(pt.name[i].use == 'official'){
        return pt.name[i].given + ' ' + pt.name[i].family
      }
    }
}

function displayPatient(pt) {
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
   // document.getElementById('gender').innerHTML = pt.gender;
    document.getElementById('dob').innerHTML = pt.birthDate;
}

function defaultPatient() {
    return {
      gender: {
        value: ''
      },
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
  //console.log(max_date)
  for(i=0; i < ob_arr.length; i++){
    if(new Date(ob_arr[i].effectiveDateTime).getTime() == max_date.getTime()){
      return getQuantityValueAndUnit(ob_arr[i])
    }
  }
}

function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });
}

var p = defaultPatient();

FHIR.oauth2.ready().then(function(client) {
  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${client.patient.id}`).then(
    function(patient) {
      displayPatient(patient);
      p.gender = patient.gender;
    }
  );
  // get observation resoruce values

  var query = new URLSearchParams();

  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|58131-4', 
    'http://loinc.org|72058-1',
    'http://loinc.org|29463-7', //Body Weight Measured
    'http://loinc.org|82593-5',
    'http://loinc.org|55284-4', //Blood Pressure
    'http://loinc.org|8480-6', //Blood Pressure
    'http://loinc.org|8462-4', //Blood Pressure
    'http://loinc.org|55018-6', //Flu vaccine
    'http://loinc.org|97073-1', //Covid vaccine
    'http://loinc.org|97073-1',
    'http://loinc.org|77353-1', //Colon cancer screening, noninvasive
    'http://loinc.org|LP6191-3', //Colon cancer screening, colonoscopy
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {
      // group all of the observation resoruces by type into their own
      var byCodes = client.byCodes(ob, 'code');
      var flu_vaccine = byCodes('55018-6');
      
      var covid_vaccine = byCodes('97073-1');

      console.log(ob)
      // create patient object
      console.log(p)
      
      //Display vitals data 
      var weight = byCodes('29463-7');
      var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
      var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');

      document.getElementById('weight').innerHTML = getMaxValue(getMaxDate(weight), weight);
      document.getElementById('weight_date').innerHTML = getMaxDate(weight).toDateString();
      document.getElementById('systolicbp').innerHTML = systolicbp;
      document.getElementById('diastolicbp').innerHTML = diastolicbp;

      //Display vaccine data
      if (flu_vaccine = 'undefined'){ 
        document.getElementById('flu_vaccine').innerHTML = 'No Recent Vaccine';
      } else {
        document.getElementById('flu_vaccine').innerHTML = flu_vaccine;
      }
      
      if (covid_vaccine = 'undefined'){ 
        document.getElementById('covid_vaccine').innerHTML = 'No Recent Vaccine';
      } else {
        document.getElementById('covid_vaccine').innerHTML = covid_vaccine;
      }
     
      //Adult health indicators and prevention data
       console.log(client.patient)
      //Colon Cancer Screening
      var colon_cancer = byCodes('77353-1');
      

    });
  }).catch(console.error);
