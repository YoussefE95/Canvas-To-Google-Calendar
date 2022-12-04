const domainInput = document.querySelector("#domain-input");
const tokenInput = document.querySelector("#token-input");
const assignmentsList = document.getElementById("assignments-list");
const fetchAssignments = document.getElementById("fetch-assignments");

domainInput.addEventListener("change", async (e) => {
  const domain = e.target.value;
  console.log("Inside DI,AE,step1");
  await browser.storage.local.set({ domain });
  //console.log("domain" + domain);
});

tokenInput.addEventListener("change", async (e) => {
  const token = e.target.value;
console.log("step2");
  await browser.storage.local.set({ token });
});

const getSelf = async () => {
  console.log("step3");
  try {
    const { domain } = await browser.storage.local.get("domain");
    const { token } = await browser.storage.local.get("token");
    const url = `https://${domain}.instructure.com/api/v1/users/self`;
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    return error;
  }
};

const getCourses = async () => {
  console.log("step4");
  try {
    const { domain } = await browser.storage.local.get("domain");
    const { token } = await browser.storage.local.get("token");
    const url = `https://${domain}.instructure.com/api/v1/courses?enrollment_state=active`;
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    return error;
  }
};

const getCoursesMap = (courses) => {
  console.log("step5");
  const map = {};
  courses.forEach((course) => {
    map[course.id] = course.course_code;
  });
  return map;
};

const getAssignments = async (selfId, coursesMap) => {
  console.log("step6");
  const keys = Object.keys(coursesMap);
  const promises = keys.map((id) => getAssignmentsByCourse(selfId, id));
  const assignments = await Promise.all(promises);
  //console.log("hello");

  return assignments;
};

const filterAssignments = async (assignments) => {
  console.log("step7");
  const currentDate = new Date();
  const filtered = assignments.filter(
    (assignment) => currentDate <= new Date(assignment.due_at)
  );
  return filtered;
};

const getAssignmentsByCourse = async (selfId, courseId) => {
  console.log("step8");
  const { domain } = await browser.storage.local.get("domain");
  const { token } = await browser.storage.local.get("token");
  const url = `https://${domain}.instructure.com/api/v1/users/${selfId}/courses/${courseId}/assignments`;
    const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
};

fetchAssignments.addEventListener("click", async () => {
  console.log("step9");
  try {
    document.getElementById("assignments-list").value = "";  
console.log("AL Field = " + document.getElementById("assignments-list").value);    
    const self = await getSelf();
    const courses = await getCourses();
    const coursesMap = getCoursesMap(courses);
    const assignments = await getAssignments(self.id, coursesMap);
    const assignmentsDue = await filterAssignments(assignments.flat());

    const assignmentObjs = assignmentsDue.map((assignment) => {
      return {
        id: assignment.id,
        course: coursesMap[assignment["course_id"]],
        assignment: assignment.name,
        due_at: new Date(assignment["due_at"]).toLocaleString(),     };
    });

      // Convert local storage to Parse JSON object
      var parseAssignList = [];
      parseAssignList = convertLocalStorageToJSON("assignmentsList");

    assignmentObjs.forEach((assignment) => {

      // Search if assignment exists in array.
      if ((parseAssignList) && (parseAssignList.length > 0)) {
        var courseFound = 0;
        for (var i=0; i<parseAssignList.length; i++) {
          if (parseAssignList[i].id == assignment.id) {
          courseFound = 1;
        }
      }
        
        if (!courseFound) {
          parseAssignList.push(assignment);
        }
      } else {
          parseAssignList.push(assignment);
      }
    });
      
      var listItemText = "";      
      // const listItem = document.createElement("li");

      //      listItem.innerText = `  Course: ${assignment.course}
      //                                  Assignment Name: ${assignment.assignment}
      //                                  Due Date: ${assignment.due_at}`;

      for (var i=0; i<parseAssignList.length; i++) {
          listItemText = `  Course: ${parseAssignList[i].course}
                                        Assignment Name: ${parseAssignList[i].assignment}
                                        Due Date: ${parseAssignList[i].due_at}`;
          assignmentsList.append(listItemText);
      }
console.log("Assignment List = " + assignmentsList.value);
      // Once all the manipulations are done; convert array to localstorage.
      // convert array to JSON string, using JSON.stringify()
      const jsonArr = JSON.stringify(parseAssignList);
      
      // save to localStorage
      localStorage.setItem("assignmentsList", jsonArr);
      console.log("ls AS = " + localStorage.getItem("assignmentsList"));
    
  } catch (error) {
    console.log(error);
  }
});

const init = async () => {
  console.log("step11");
  const { domain } = await browser.storage.local.get("domain");
  const { token } = await browser.storage.local.get("token");

  if (domain) {
    domainInput.value = domain;
  }

  if (token) {
    tokenInput.value = token;
  }

  // initialize local storage
  localStorage.clear();
};

init().catch((e) => {
  console.error(e);
});


function convertLocalStorageToJSON(lsName) {
  // Convert localstorage to json.parse -- array; get the string, from localStorage
  const assignmentListWOParse = localStorage.getItem(lsName);

  // convert string to valid object
  const tempAssignList = JSON.parse(assignmentListWOParse);
  var parseAssignList = [];
  if (tempAssignList) {
    parseAssignList = tempAssignList;
  }

  return parseAssignList;
}
