// TODO: error handling and data validation is required here
// ex: verify that ids exist in related tables, undefined values should be passed as empty strings, etc...

module.exports = (logger, dbClient, twilioClient) => {
    const subscriptionController = require("../../controllers/subscriptionsController")(logger, dbClient, twilioClient);

    let module = {};

    module.createMeeting = async (meeting_type, meeting_start_timestamp, virtual_meeting_url, status) => {
        res = await dbClient.createMeeting(meeting_type, meeting_start_timestamp, virtual_meeting_url, status);
        new_id = res.rows[0].id;
        res = await dbClient.getMeeting(new_id);
        return res.rows[0];
    };
    
    module.createMeetingItem = async (meeting_id, order_number, item_start_timestamp, item_end_timestamp, status, content_categories, description_loc_key, title_loc_key) => {
        res = await dbClient.createMeetingItem(meeting_id, order_number, item_start_timestamp, item_end_timestamp, status, content_categories, description_loc_key, title_loc_key);
        new_id = res.rows[0].id;
        res = await dbClient.getMeetingItem(new_id);
        return res.rows[0];
    };
    
    module.createSubscription = async (phone_number, email_address, meeting_item_id, meeting_id) => {
        res = await dbClient.createSubscription(phone_number, email_address, meeting_item_id, meeting_id)
        new_id = res.rows[0].id;
        res = await dbClient.getSubscription(new_id);
        return res.rows[0];
    };
    
    module.updateMeetingItem = async (id, order_number, status, item_start_timestamp, item_end_timestamp, content_categories, description_loc_key, title_loc_key) => {
        res = await dbClient.updateMeetingItem(id, order_number, status, item_start_timestamp, item_end_timestamp, content_categories, description_loc_key, title_loc_key);
        res = await dbClient.getMeetingItem(id);
        meeting_item = res.rows[0];
    
        switch(status) {
            case "COMPLETED":
                subscriptionController.notifyItemSubscribers(id, "ITEM(S) COMPLETED: ");
                break;
            case "IN PROGRESS":
                subscriptionController.notifyItemSubscribers(id, "ITEM(S) IN PROGRESS: ");
                subscriptionController.notifyNextItemSubscribers(meeting_item, "YOUR ITEM(S) IS/ARE UP NEXT: ");
                break;
        }
    
        return meeting_item;
    };
    
    module.updateMeeting = async (id, status, meeting_type, virtual_meeting_url, meeting_start_timestamp, meeting_end_timestamp) => {
        res = await dbClient.updateMeeting(id, status, meeting_type, virtual_meeting_url, meeting_start_timestamp, meeting_end_timestamp);
        
        switch(status) {
            case "COMPLETED":
                subscriptionController.notifyMeetingSubscribers(id, "MEETING COMPLETE: ");
                break;
            case "IN PROGRESS":
                subscriptionController.notifyMeetingSubscribers(id, "MEETING IN PROGRESS: ");
                break;
        }
        
        res = await dbClient.getMeeting(id);
        return res.rows[0];
    };

    return module;
};