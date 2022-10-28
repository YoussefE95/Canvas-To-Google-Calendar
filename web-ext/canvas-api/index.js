const canvasAPI = require('node-canvas-api');
const config = require('config.json');

process.env.CANVAS_API_DOMAIN = config.domain;
process.env.CANVAS_API_TOKEN = config.token;

const getAssignments = async () => {
    try {
        const self = await canvasAPI.getSelf();
        const courses = await canvasAPI.getCoursesByUser(self.id);
        const currentDate = new Date();
    
        courses.forEach(async (course) => {
            if(!course.access_restricted_by_date) {
                const courseAssignments = await canvasAPI.getAssignments(course.id);
    
                courseAssignments.forEach((assignment) => {
                    if(assignment.due_at) {
                        const dueDate = new Date(assignment.due_at);
    
                        if(currentDate < dueDate) {
                            const assignmentInfo = {
                                "name": assignment.name,
                                "class": course.course_code,
                                "due": dueDate,
                            };
                            console.log(assignmentInfo);
                        }
                    }
                });
            }
        });
    } catch(err) {
        console.log(err);
    }
};

getAssignments();