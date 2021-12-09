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
   // document.getElementById('dob').innerHTML = pt.birthDate;
}

function defaultPatient() {
    return {
      gender: {
        value: ''
      },
      age: {
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

function getMaxValDateArray(ob_arr) {
  //console.log(max_date)
  return new Date(Math.max.apply(null, ob_arr));
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
  return getMaxValue(getMaxDate(formattedBPObservations), formattedBPObservations );
}

var p = defaultPatient();

FHIR.oauth2.ready().then(function(client) {
  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${client.patient.id}`).then(
    function(patient) {
      p.gender = patient.gender;
      console.log(patient.birthDate)
      var date_diff = Date.now() - new Date(patient.birthDate);
      var age = new Date(date_diff)
      p.age = Math.abs(age.getUTCFullYear()-1970)
      displayPatient(patient); 
    }
  );
 // get immunization resoruce values
  client.request(`Immunization?patient=${client.patient.id}`, {
    resolveReferences: ['identifier', 'status']
  }).then(function(imm){
    try{
      var flu_vaccine = [];
      var tdap_vaccine = [];
      var covid_vaccine = "";
      var shingles_vaccine = [];
      var hpv_vaccine = [];
      for(i = 0; i < imm.entry.length; i++){
        try{
          if(imm.entry[i].resource.vaccineCode.coding[0].code == '208'){ 
            covid_vaccine = new Date(imm.entry[0].resource.date);
            document.getElementById('covid_vaccine').innerHTML = covid_vaccine.toDateString();
          } 
          if(imm.entry[i].resource.vaccineCode.coding[0].code == '140'){
            //console.log(imm.entry[i].resource)
            flu_vaccine.push(new Date(imm.entry[i].resource.occurrenceDateTime));
            document.getElementById('flu_vaccine').innerHTML = getMaxValDateArray(flu_vaccine).toDateString();
          } 
          if(imm.entry[i].resource.vaccineCode.coding[0].code == '115'){
            tdap_vaccine.push(new Date(imm.entry[i].resource.occurrenceDateTime));
            document.getElementById('tdap_vaccine').innerHTML = getMaxValDateArray(tdap_vaccine).toDateString();
          } 
          if(p.age > 50){
            if(imm.entry[i].resource.vaccineCode.coding[0].code == '121'){
              shingles_vaccine.push(new Date(imm.entry[i].resource.occurrenceDateTime));
              document.getElementById('shingles_vaccine').innerHTML = getMaxValDateArray(shingles_vaccine).toDateString();
            } 
          } else {
            document.getElementById('shingles_label').style.display = "none"
            document.getElementById('shingles_vaccine').style.display = "none"
          }
          if(p.age > 9){
            if(imm.entry[i].resource.vaccineCode.coding[0].code == '62'){
              hpv_vaccine.push(new Date(imm.entry[i].resource.occurrenceDateTime));
              document.getElementById('hpv_vaccine').innerHTML = getMaxValDateArray(hpv_vaccine).toDateString();
            } 
          } else {
            document.getElementById('hpv_label').style.display = "none"
            document.getElementById('hpv_vaccine').style.display = "none"
          }
          
          if(flu_vaccine == "undefined"|| flu_vaccine == ""  ||flu_vaccine =='Invalid Date') {
            document.getElementById('flu_vaccine').innerHTML = 'No Recent Vaccine';
          }
          if(covid_vaccine == "undefined" || covid_vaccine == "") {
              document.getElementById('covid_vaccine').innerHTML = 'No Recent Vaccine';
          }
          if(tdap_vaccine == "undefined" || tdap_vaccine == "") {
            document.getElementById('tdap_vaccine').innerHTML = 'No Recent Vaccine';
          }
          if(shingles_vaccine == "undefined" || shingles_vaccine == "") {
            document.getElementById('shingles_vaccine').innerHTML = 'No Recent Vaccine';
          }
          if(hpv_vaccine == "undefined" || hpv_vaccine == "") {
            document.getElementById('hpv_vaccine').innerHTML = 'No Recent Vaccine';
          }
        } catch(err) {
            console.log(err.message)
        }
      }
    } catch(err) {
      document.getElementById('covid_vaccine').innerHTML = 'No Recent Vaccine';
      document.getElementById('flu_vaccine').innerHTML = 'No Recent Vaccine';
      document.getElementById('tdap_vaccine').innerHTML = 'No Recent Vaccine';
      document.getElementById('shingles_vaccine').innerHTML = 'No Recent Vaccine';
      console.log(err.message)
    }
  }                 
  );

  // get procedure resource values 
  client.request(`Procedure?patient=${client.patient.id}`, {
    resolveReferences: ['identifier', 'status']
  }).then(function(proc){
    var c_dates = [];
    try{
      for(i in proc.entry){
        if(proc.entry[i].resource.code.coding[0].code =='73761001')
        {
         // console.log(new Date(proc.entry[i].resource.performedPeriod.end))
          c_dates.push(new Date(proc.entry[i].resource.performedPeriod.end))
        }
      }
    if(c_dates.length > 0 && p.age > 49) {
      document.getElementById('colon_cancer').innerHTML = getMaxValDateArray(c_dates).toDateString();
    } else if(c_dates.length ==0 && p.age > 49) {
      document.getElementById('colon_cancer').innerHTML = 'No Recent Screening';
    } else {
      document.getElementById('colon_cancer_label').style.display = "none"
      document.getElementById('colon_cancer').style.display = "none"
    }
  } catch(err) {
    document.getElementById('colon_cancer_label').style.display = "none"
    document.getElementById('colon_cancer').style.display = "none"
    console.log(err.message)
  }
  });

  var query = new URLSearchParams();
 // get observation resoruce values
  query.set("patient", client.patient.id);
  query.set("_count", 150);
 // query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|58131-4', 
    'http://loinc.org|72058-1',
    'http://loinc.org|29463-7', //Body Weight Measured
    'http://loinc.org|82593-5',
    'http://loinc.org|55284-4', //Blood Pressure
    'http://loinc.org|8480-6', //Blood Pressure
    'http://loinc.org|8462-4', //Blood Pressure
    'http://loinc.org|2339-0', //Glucose in Blood
    'http://loinc.org|76629-5', //Glucose fasting in Blood
    'http://loinc.org|1558-6', //Glucose fasting in plasma
    'http://loinc.org|10450-5', //Glucose fasting in plasma
    'http://loinc.org|2345-7', //Glucose  in plasma
    'http://loinc.org|33248-6', //Diabetes status
    'http://loinc.org|97073-1', 
    'http://loinc.org|77353-1', //Colon cancer screening, noninvasive
    'http://loinc.org|28023-0', //Colon cancer screening, colonoscopy
    'http://loinc.org|86662-4', //Cervical cancer screening - cervical cytology
    'http://loinc.org|8302-2', // Height
    'http://loinc.org|2085-9', //cholesterol
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
      
      //Display WEIGHT
      var weight = byCodes('29463-7');
      console.log(weight.length)
      if (weight == 'undefined' || weight.length == 0) {
        document.getElementById('weight').innerHTML = 'No Recent Measurement'
        document.getElementById('weight_date').innerHTML = 'No Recent Measurement' 
      } else {
        document.getElementById('weight').innerHTML = getMaxValue(getMaxDate(weight), weight);
        document.getElementById('weight_date').innerHTML = getMaxDate(weight).toDateString();
      }
      //Display BP
      var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
      var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
      console.log(systolicbp)
      console.log(diastolicbp)
      if (systolicbp == 'undefined') {
        document.getElementById('systolicbp').innerHTML = 'No Recent Measurement'
        document.getElementById('diastolicbp').innerHTML = 'No Recent Measurement' 
      } else {
        document.getElementById('systolicbp').innerHTML = systolicbp;
        document.getElementById('diastolicbp').innerHTML = diastolicbp;  
      }
      
      var cholesterol = byCodes('2085-9');
      console.log(cholesterol)
      if (cholesterol == 'undefined' || cholesterol.length == 0) {
        document.getElementById('cholesterol').innerHTML = 'No Recent Measurement'
        document.getElementById('cholesterol_date').innerHTML = 'No Recent Measurement' 
      } else {
        document.getElementById('cholesterol').innerHTML = getMaxValue(getMaxDate(cholesterol), cholesterol);
        document.getElementById('cholesterol_date').innerHTML = getMaxDate(cholesterol).toDateString();
      }
      //Child health indicators and prevention data
      if (p.age < 18) {
        //HEIGHT
        var height = byCodes('8302-2');
        if (height = 'undefined') {
          document.getElementById('height').innerHTML = 'No Recent Measurement'
          document.getElementById('height_date').innerHTML = 'No Recent Measurement' 
        } else {
           document.getElementById('height').innerHTML = getMaxValue(getMaxDate(height), height);
           document.getElementById('height_date').innerHTML = getMaxDate(height).toDateString();
        }

        document.getElementById('glucose').style.display = "none"
        document.getElementById('glucose_date').style.display = "none"
        document.getElementById('glucose_label').style.display = "none"
       
        document.getElementById('colon_cancer_label').style.display = "none"

      } //Adult health indicators and prevention data 
      else if (p.age > 17) {
        document.getElementById('height').style.display = "none"
        document.getElementById('height_date').style.display = "none"
        document.getElementById('height_label').style.display = "none"

        //GLUCOSE
        var glucose = byCodes('2345-7');
     
       
        //var glucose = byCodes('2339-0', '1558-6', '10450-5', '76629-5', '2345-7');
        if (glucose == 'undefined' || glucose.length == 0){
          
          document.getElementById('glucose').innerHTML = 'No Recent Measurement'
          document.getElementById('glucose_date').innerHTML = 'No Recent Measurement'
        } else{
          document.getElementById('glucose').innerHTML = getMaxValue(getMaxDate(glucose), glucose);
          document.getElementById('glucose_date').innerHTML = getMaxDate(glucose).toDateString();
        }

        if(p.gender == 'Female'){
          //CERVICAL CANCER SCREENING
          document.getElementById('c_cancer').style.display = "initial"
          document.getElementById('c_cancer_label').style.display = "initial"
          
          var cervical_cancer = byCodes('54038-5');
          console.log(cervical_cancer)
        
          if (cervical_cancer = 'undefined'){
            document.getElementById('c_cancer').innerHTML = 'No Recent Screening';
          } else{
            document.getElementById('c_cancer').innerHTML = cervical_cancer;
        }
        console.log('here')
        //COLON CANCER SCREENING
        if (p.age > 44){
          console.log('here')
          var colonoscopy = byCodes('28023-0');
          if (colonoscopy = 'undefined'){

            document.getElementById('colon_cancer').innerHTML = 'No Recent Screening';
          } else{
            document.getElementById('colon_cancer').innerHTML = colonoscopy;
        } 
        }
      }

      // TO DO: Get conditions, not obs
        var diabetes = byCodes('44054006');
      //  console.log(diabetes)
      } else {
      
     
      }
   

    });
   
   
    
  }).catch(console.error);
