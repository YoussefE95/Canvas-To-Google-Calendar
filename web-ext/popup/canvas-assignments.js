const domainInput = document.querySelector("#domain-input");
const tokenInput = document.querySelector("#token-input");
const assignmentsList = document.getElementById("assignments-list");
const fetchAssignments = document.getElementById("fetch-assignments");
const loader = document.getElementById("loader");

browser.storage.local.get(['assignments'], function(result) {
  if(!(result.assignments == undefined) || !(result.assignments == "undefined") ) {
      result.assignments.forEach((assignment) => {
        const listItem = document.createElement("li");
        listItem.innerText = `Course: ${assignment.course}
        Assignment Name: ${assignment.assignment}
        Due Date: ${assignment.due_at}`;
        assignmentsList.append(listItem);
      });
    }
});

domainInput.addEventListener("change", async (e) => {
  const domain = e.target.value;
  await browser.storage.local.set({ domain });
});

tokenInput.addEventListener("change", async (e) => {
  const token = e.target.value;
  await browser.storage.local.set({ token });
});

const addLoader = () => {
  loader.classList.add("loader");
}

const removeLoader = () => {
  loader.classList.remove("loader");
}

const getSelf = async () => {
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
  const map = {};
  courses.forEach((course) => {
    map[course.id] = course.course_code;
  });
  return map;
};

const getAssignments = async (selfId, coursesMap) => {
  const keys = Object.keys(coursesMap);
  const promises = keys.map((id) => getAssignmentsByCourse(selfId, id));
  const assignments = await Promise.all(promises);
  return assignments;
};

const filterAssignments = async (assignments) => {
  const currentDate = new Date();
  const filtered = assignments.filter(
    (assignment) => currentDate <= new Date(assignment.due_at)
  );
  return filtered;
};

const getAssignmentsByCourse = async (selfId, courseId) => {
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
  addLoader();
  assignmentsList.innerHTML = '';
  try {  
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
        due_at: new Date(assignment["due_at"]).toLocaleString(),
      };
    });
    // console.log(assignmentObjs);
    browser.storage.local.set({
      "assignments": assignmentObjs
    }, () => {
      browser.storage.local.get(['assignments'], function(result) {
        console.log(result.assignments);
      });
    });

    assignmentObjs.forEach((assignment) => {
      const listItem = document.createElement("li");
      listItem.innerText = `Course: ${assignment.course}
      Assignment Name: ${assignment.assignment}
      Due Date: ${assignment.due_at}`;
      assignmentsList.append(listItem);
    });
    removeLoader();
  } catch (error) {
    console.log(error);
  }
});

const init = async () => {
  const { domain } = await browser.storage.local.get("domain");
  const { token } = await browser.storage.local.get("token");

  if (domain) {
    domainInput.value = domain;
  }

  if (token) {
    tokenInput.value = token;
  }
};

init().catch((e) => {
  console.error(e);
});