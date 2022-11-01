const config = require('./config.json');

process.env.CANVAS_API_DOMAIN = config.domain;
process.env.CANVAS_API_TOKEN = config.token;

const canvasAPI = require('node-canvas-api');

const getAssignments = async () => {
    try {
        const self = await canvasAPI.getSelf();
        const courses = await canvasAPI.getCoursesByUser(self.id);
  
        const sectionedAssignments = courses.filter(course => {
            if(course.access_restricted_by_date) {
                return false;
            } else {
                return true;
            }
        }).map(async course => {
            const courseAssignments = await canvasAPI.getAssignments(course.id);
            const currentDate = new Date();
        
            return courseAssignments.filter(assignment => {
                if (assignment.due_at) {
                    if (currentDate < new Date(assignment.due_at)) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }).map(assignment => {
                return {
                    "name": assignment.name,
                    "class": course.course_code,
                    "due": new Date(assignment.due_at),
                };
            });
        });

        const allAssignments = await Promise.all(sectionedAssignments)
            .then(assignment => {
                return assignment;
            })

        return allAssignments.flat();
    } catch(error) {
        return { message: 'Assignment retrieval failed', error }
    }
};

module.exports = {
    getAssignments
}