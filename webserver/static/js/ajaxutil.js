function send_json_post(url, data, done) {
    
//    let dialog = DialogManager.info('loading...');

//    dialog.show();
    
    response = null;
    $.ajax({
        url: url,
        type: 'post',
        contentType: 'application/json; charset=utf-8',
        success: function(d) {
            response = d;
        },
        data: JSON.stringify(data),
        async: true
    }).done(function (data) {
//        dialog.hide();
        data = JSON.parse(data)
        done(data);
    });
    

}