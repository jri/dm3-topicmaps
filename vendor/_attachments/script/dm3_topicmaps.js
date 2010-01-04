function dm3_topicmaps() {

    var topicmaps = {}  // Loaded topicmaps (key: topicmap ID, value: Topicmap object)
    var topicmap        // Selected topicmap (Topicmap object)

    css_stylesheet("vendor/dm3-topicmaps/style/dm3-topicmaps.css")

    types["Topicmap"] = {
        fields: [
	        {id: "Title",       model: {type: "text"}, view: {editor: "single line"}, content: ""},
	        {id: "Description", model: {type: "html"}, view: {editor: "multi line"},  content: ""}
        ],
        view: {
			appears_in_menu: false
        },
        implementation: "PlainDocument"
    }



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {

        var topicmaps = get_all_topicmaps()
        create_default_topicmap()
        create_topicmap_menu()
        create_topicmap_dialog()
        load_topicmap()

        function create_default_topicmap() {
            if (topicmaps.rows.length == 0) {
                create_topicmap("untitled")
                topicmaps = get_all_topicmaps()
            }
        }

        function create_topicmap_menu() {
            var topicmap_label = $("<span>").attr("id", "topicmap_label").text("Topicmap")
            var topicmap_menu = $("<div>").attr("id", "topicmap_menu")
            var topicmap_form = $("<div>").attr("id", "topicmap_form").append(topicmap_label).append(topicmap_menu)
            $("#upper-toolbar").prepend(topicmap_form)
            ui.menu("topicmap_menu", topicmap_selected)
            update_topicmap_menu(topicmaps)
        }

        function create_topicmap_dialog() {
            var topicmap_dialog = $("<div>").attr("id", "topicmap_dialog")
            var input = $("<input>").attr({id: "topicmap_name", size: 30})
            topicmap_dialog.append("Title:")
            topicmap_dialog.append($("<form>").submit(do_create_topicmap).append(input))
            $("body").append(topicmap_dialog)
            $("#topicmap_dialog").dialog({modal: true, autoOpen: false, draggable: false, resizable: false, width: 350,
                title: "New Topicmap", buttons: {"OK": do_create_topicmap}})
        }

        function load_topicmap() {
            var topicmap_id = ui.menu_item("topicmap_menu").value
            select_topicmap(topicmap_id)
        }
	}

    /**
     * @param   topic   a CanvasTopic object
     */
    this.post_add_topic_to_canvas = function(topic) {
        // error check
        if (!topicmap) {
            alert("post_add_topic_to_canvas: no topicmap is selected")
            return
        }
        //
        topicmap.add_topic(topic.id, topic.type, topic.label, topic.x, topic.y)
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function get_all_topicmaps() {
        return get_topics_by_type("Topicmap")
    }

    function create_topicmap(name) {
        log("Creating topicmap \"" + name + "\"")
        var topicmap = create_topic("Topicmap", {"Title": name})
        log("..... " + topicmap._id)
        return topicmap
    }

    function topicmap_selected(menu_item) {
        var topicmap_id = menu_item.value
        if (topicmap_id == "_new") {
            new_topicmap()
        } else {
            select_topicmap(topicmap_id)
            reveal_document(topicmap_id)    // FIXME: to be dropped
        }
    }

    function select_topicmap(topicmap_id) {
        log("Selecting topicmap " + topicmap_id)
        topicmap = get_topicmap(topicmap_id)
    }

    function new_topicmap() {
        $("#topicmap_dialog").dialog("open")
    }

    function do_create_topicmap() {
        $("#topicmap_dialog").dialog("close")
        var name = $("#topicmap_name").val()
        var topicmap_id = create_topicmap(name)._id
        update_topicmap_menu()
        select_menu_item(topicmap_id)
        select_topicmap(topicmap_id)
        return false
    }

    function update_topicmap_menu(topicmaps) {
        if (!topicmaps) {
            topicmaps = get_all_topicmaps()
        }
        // add menu items
        ui.empty_menu("topicmap_menu")
        var icon_src = get_icon_src("Topicmap")
        for (var i = 0, row; row = topicmaps.rows[i]; i++) {
            ui.add_menu_item("topicmap_menu", {label: row.value, value: row.id, icon: icon_src})
        }
        ui.add_menu_separator("topicmap_menu")
        ui.add_menu_item("topicmap_menu", {label: "New Topicmap...", value: "_new", is_trigger: true})
    }

    function select_menu_item(topicmap_id) {
        ui.select_menu_item("topicmap_menu", topicmap_id)
    }

    function get_topicmap(id) {
        // load topicmap on-demand
        if (!topicmaps[id]) {
            topicmaps[id] = new Topicmap(id)
        }
        //
        return topicmaps[id]
    }



	/*****************************/
	/********** Classes **********/
	/*****************************/



    /**
     * A persistent topicmap.
     */
	function Topicmap(topicmap_id) {

        // Topics of this topicmap (key: topic ID, value: Topic object)
        var topics = {}

        load()

        function load() {
            // Round 1: load topic references and init position
    	    log("Loading topicmap " + topicmap_id)
    	    var rows = db.view("deepamehta3/dm3-topicmaps", {key: [topicmap_id, "Topic"]}).rows
    	    var topic_ids = []
    	    log("..... " + rows.length + " topics")
            for (var i = 0, row; row = rows[i]; i++) {
                var topic_id = row.value.topic_id
                var pos = row.value.pos
                topic_ids.push(topic_id)
                topics[topic_id] = new Topic(topic_id, undefined, undefined, pos.x, pos.y)
            }
            // Round 2: init topic type and topic label
            var tpcs = get_topics(topic_ids)
            for (var i = 0, t; t = tpcs[i]; i++) {
                var topic = topics[t.id]
                topic.type = t.type
                topic.label = t.label
            }
        }

        this.add_topic = function(id, type, label, x, y) {
    	    log("Adding topic \"" + label + "\" to topicmap " + topicmap_id)
            topics[id] = new Topic(id, type, label, x, y)
            //
            var fields = {
                topic_pos: {x: x, y: y},
                topic_visible: true
            }
            create_relation("Topic Ref", topicmap_id, id, fields)
        }

        function Topic(id, type, label, x, y) {
            this.id = id
            this.type = type
            this.label = label
            this.x = x
            this.y = y
        }
	}
}
