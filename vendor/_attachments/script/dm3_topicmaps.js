function dm3_topicmaps() {

    types["Topicmap"] = {
        fields: [
            {id: "Title",       model: {type: "text"}, view: {editor: "single line"}, content: ""},
            {id: "Description", model: {type: "html"}, view: {editor: "multi line"},  content: ""}
        ],
        view: {
        },
        implementation: "PlainDocument"
    }

    css_stylesheet("vendor/dm3-topicmaps/style/dm3-topicmaps.css")

    var topicmaps = {}  // Loaded topicmaps (key: topicmap ID, value: Topicmap object)
    var topicmap        // Selected topicmap (Topicmap object)



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
            alert("ERROR at post_add_topic_to_canvas: no topicmap is selected")
            return
        }
        //
        topicmap.add_topic(topic.id, topic.type, topic.label, topic.x, topic.y)
    }

    /**
     * @param   relation   a CanvasAssoc object
     */
    this.post_add_relation_to_canvas = function(relation) {
        // error check
        if (!topicmap) {
            alert("ERROR at post_add_relation_to_canvas: no topicmap is selected")
            return
        }
        //
        topicmap.add_relation(relation.id, relation.doc1_id, relation.doc2_id)
    }

    this.post_move_topic_on_canvas = function(topic) {
        topicmap.move_topic(topic.id, topic.x, topic.y)
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
        }
    }

    function select_topicmap(topicmap_id) {
        log("Selecting topicmap " + topicmap_id)
        topicmap = get_topicmap(topicmap_id)
        topicmap.display_on_canvas()
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

        var topics = {}     // Topics of this topicmap (key: topic ID, value: Topic object)
        var relations = {}  // Relations of this topicmap (key: relation ID, value: Relation object)

        load()

        this.display_on_canvas = function() {
            canvas.clear()
            for (var topic_id in topics) {
                var topic = topics[topic_id]
                canvas.add_topic(topic.id, topic.type, topic.label, false, topic.x, topic.y)
            }
            for (var rel_id in relations) {
                var rel = relations[rel_id]
                canvas.add_relation(rel.id, rel.doc1_id, rel.doc2_id)
            }
            canvas.refresh()
        }

        this.add_topic = function(id, type, label, x, y) {
            if (!topics[id]) {
                log("Adding topic " + id + " (\"" + label + "\") to topicmap " + topicmap_id)
                // update DB
                var ref_fields = {
                    topic_pos: {x: x, y: y},
                    topic_visible: true
                }
                var ref = create_relation("Topic Ref", topicmap_id, id, ref_fields)
                // update model
                topics[id] = new Topic(id, type, label, x, y, ref._id)
            } else {
                log("Topic " + id + " (\"" + label + "\") already in topicmap " + topicmap_id)
            }
        }

        this.add_relation = function(id, doc1_id, doc2_id) {
            if (!relations[id]) {
                log("Adding relation " + id + " to topicmap " + topicmap_id)
                // update DB
                var ref = create_relation("Relation Ref", topicmap_id, id)
                // update model
                relations[id] = new Relation(id, doc1_id, doc2_id)
            } else {
                log("Relation " + id + " already in topicmap " + topicmap_id)
            }
        }

        this.move_topic = function(id, x, y) {
            var topic = topics[id]
            //
            if (!topic) {
                alert("ERROR at move_topic: topic " + id + " not found in topicmap " + topicmap_id)
            }
            // update DB
            var ref = db.open(topic.ref_id)
            ref.topic_pos = {x: x, y: y}
            log("Updating topic " + id + " (x=" + x + " y=" + y + ") => " + JSON.stringify(ref))
            save_document(ref)
            // update model
            topic.x = x
            topic.y = y
        }

        function load() {

            load_topics()
            load_relations()

            function load_topics() {
                // Round 1: load topic references and init position
                log("Loading topicmap " + topicmap_id)
                var rows = db.view("deepamehta3/dm3-topicmaps", {key: [topicmap_id, "Topic"]}).rows
                var topic_ids = []
                log("..... " + rows.length + " topics")
                for (var i = 0, row; row = rows[i]; i++) {
                    var topic_id = row.value.topic_id
                    var pos = row.value.pos
                    topic_ids.push(topic_id)
                    topics[topic_id] = new Topic(topic_id, undefined, undefined, pos.x, pos.y, row.id)
                }
                // Round 2: init topic type and topic label
                var tpcs = get_topics(topic_ids)
                for (var i = 0, t; t = tpcs[i]; i++) {
                    var topic = topics[t.id]
                    topic.type = t.type
                    topic.label = t.label
                }
            }

            function load_relations() {
                // Round 1: load relation references
                var rows = db.view("deepamehta3/dm3-topicmaps", {key: [topicmap_id, "Relation"]}).rows
                var rel_ids = []
                log("..... " + rows.length + " relations")
                for (var i = 0, row; row = rows[i]; i++) {
                    var rel_id = row.value.relation_id
                    rel_ids.push(rel_id)
                    relations[rel_id] = new Relation(rel_id)
                }
                // Round 2: init doc IDs
                var rltns = get_relations(rel_ids)
                for (var i = 0, r; r = rltns[i]; i++) {
                    var rel = relations[r.id]
                    rel.doc1_id = r.doc1_id
                    rel.doc2_id = r.doc2_id
                }
            }
        }

        function Topic(id, type, label, x, y, ref_id) {
            this.id = id
            this.type = type
            this.label = label
            this.x = x
            this.y = y
            this.ref_id = ref_id
        }

        function Relation(id, doc1_id, doc2_id) {
            this.id = id
            this.doc1_id = doc1_id
            this.doc2_id = doc2_id
        }
    }
}
