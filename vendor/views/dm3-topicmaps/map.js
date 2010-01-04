function(doc) {
    if (doc.type == "Relation") {
        if (doc.rel_type == "Topic Ref") {
            emit([doc.rel_doc_ids[0], "Topic"], {
                topic_id: doc.rel_doc_ids[1],
                pos: doc.topic_pos,
                visible: doc.topic_visible
            })
        } else if (doc.rel_type == "Relation Ref") {
            emit([doc.rel_doc_ids[0], "Relation"], {
                relation_id: doc.rel_doc_ids[1]
            })
        }
    }
}
