var page_size = 20;
var page_disp = 10;
var start_page = 0;
var active_page = 0;
var date = "";

var border_table = d3.select("#border_table");

var xmlHttpRequest;

var query_btn = d3.select("#query_btn")
    .on("click",init_query_func);

function is_date_time(date){
    var reg = new RegExp("^2\\d{3}(0\\d|1[0-2])([0-2]\\d|3[0-1])$");
    if (!reg.test(date)){
        alert("invalid time format "+date+"(use YYYYMMDD)");
        return false;
    }
    return true;
}

function init_query_func(){
    var url = "query.php";
    var date_text = d3.select("#date_text").property("value");
    if ( ! is_date_time(date_text) ){
        return;
    }

    date = date_text;

    var post_str = "type=info&date="+date;

    xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("POST", url, true);
    xmlHttpRequest.onreadystatechange = init_query_ready;
    xmlHttpRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xmlHttpRequest.send(post_str);
}

var dataset, table_list, num_page, monitor_json;

function init_query_ready(){
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200) {
        var text = xmlHttpRequest.responseText;
        var info_json = JSON.parse(text);
        start_page = 0;
        active_page = 0;
        num_page = Math.ceil(info_json.num_node/page_size);

        monitor_query_func();
        //query_page();

        $("#prev").click(function(){
            start_page = 0;
            active_page = 0;
            query_page();
        });
        $("#next").click(function(){
            start_page = num_page-page_disp;
            active_page = num_page-1;
            query_page();
        });
    }
}

function monitor_query_func(){
    var url = "query.php";
    var post_str = "type=monitor&date="+date;

    xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("POST", url, true);
    xmlHttpRequest.onreadystatechange = monitor_query_ready;
    xmlHttpRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xmlHttpRequest.send(post_str);
}

function monitor_query_ready(){
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200) {
        var text = xmlHttpRequest.responseText;
        monitor_json = JSON.parse(text);
        query_page();
    }
}

function on_page_click(e){
    var html = $(this).html();
    var value = -1;
    if (html == "..."){
        value = start_page+page_disp;
        start_page = value;
    }
    else if(html == ".."){
        value = start_page-page_disp;
        start_page = value;
    }
    else{
        value= parseInt(html)-1;
    }

    active_page = value;
    query_page();
}

function query_page(){
    var start = (active_page)*page_size;
    var end = (active_page+1)*page_size-1;
    var url = "query.php";
    var post_str = "type=page&start="+start+"&end="+end+"&date="+date;

    xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("POST", url, true);
    xmlHttpRequest.onreadystatechange = refresh_nav;
    xmlHttpRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    xmlHttpRequest.send(post_str);
}
    

function refresh_nav(){
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200) {
    var text = xmlHttpRequest.responseText;
    var page_json = JSON.parse(text);
    table_list = page_json.nodes;

    //remove remaining pages first.
    var pages = $("#pages");
    pages.find("li").not("#prev").not("#next").remove();

    //make new page nav.
    var prev = 0;
    if(start_page >= page_disp){
        pages.find("li").eq(0).after('<li class="item"><a>..</a></li>');
        prev = 1;
    }
    for (var i=start_page; i<num_page && i<start_page+page_disp; i++){
        if (i+1 > 0){
            if (i!=active_page){
                pages.find("li").eq(i-start_page+prev).after("<li class='item'><a>"+(i+1).toString()+"</a></li>");
            }
            else {
                pages.find("li").eq(i-start_page+prev).after("<li class='item active'><a>" + (i + 1).toString() + "</a></li>");
            }
        }
    }
    if(start_page+page_disp < num_page) {
        pages.find("li").eq(i-start_page+prev).after('<li class="item"><a>...</a></li>');
    }
    //add onclick listener.
    pages.find("li").not("#prev").not("#next").find("a").click(on_page_click);

    //clear table first.
    var tbl = $("#border_table");
    tbl.find("tbody tr").remove();

    //make new table.
    for (var j=0; j<table_list.length; j++) {
        var row = tbl.find("tbody").append("<tr></tr>");
        var cc;
        if (table_list[j].geoip.mmdb.country == null || table_list[j].geoip.mmdb.country == "*"){
            cc = "un";
        }
        else{
            cc = table_list[j].geoip.mmdb.country.toLowerCase();
        }
        var num_neighbour = table_list[j].neighbour.length;
        var monitor_list = table_list[j].monitor.split('|');
        var num_monitor = monitor_list.length;
        row.find("tr:eq("+ j.toString()+")").append('<td>'+ (active_page*page_size+j).toString()+'</td>');
        row.find("tr:eq("+ j.toString()+")").append('<td><span class="flag-icon flag-icon-' + cc + '"></span></td>');
        row.find("tr:eq("+ j.toString()+")").append('<td>' + table_list[j].addr + '</td>');
        row.find("tr:eq("+ j.toString()+")").append('<td>' + cc + '</td>');
        row.find("tr:eq("+ j.toString()+")").append('<td>' + table_list[j].geoip.bgp.asn + '</td>');
        row.find("tr:eq("+ j.toString()+")").append('<td>' + table_list[j].geoip.bgp.country + '</td>');
        row.find("tr:eq("+ j.toString()+")").append('<td>' + table_list[j].geoip.czdb.country + ','+ table_list[j].geoip.czdb.area +'</td>');
        row.find("tr:eq("+ j.toString()+")").append('<td><a style=cursor:pointer onclick=monitor_click(' + j.toString() + ')>' + num_monitor + '</a></td>');
        row.find("tr:eq("+ j.toString()+")").append('<td><a style=cursor:pointer onclick=neighbour_click(' + j.toString() + ')>' + num_neighbour + '</a></td>');
    }
    }
}

function neighbour_click(j){
    var nbr_list = table_list[j].neighbour;

    var tbl = $("#neighbour_table");
    tbl.find("tbody tr").remove();
    for (var i=0; i<nbr_list.length; i++) {
        var row = tbl.find("tbody").append("<tr></tr>");
        var cc;
        if (nbr_list[i].geoip.mmdb.country == null || nbr_list[i].geoip.mmdb.country == "*"){
            cc = "un";
        }
        else{
            cc = nbr_list[i].geoip.mmdb.country.toLowerCase();
        }
        row.find("tr:eq("+ i.toString()+")").append('<td>'+ (i).toString()+'</td>');
        row.find("tr:eq("+ i.toString()+")").append('<td><span class="flag-icon flag-icon-' + cc + '"></span></td>');
        row.find("tr:eq("+ i.toString()+")").append('<td>' + nbr_list[i].addr + '</td>');
        row.find("tr:eq("+ i.toString()+")").append('<td>' + cc + '</td>');
        row.find("tr:eq("+ i.toString()+")").append('<td>' + nbr_list[i].geoip.bgp.asn + '</td>');
        row.find("tr:eq("+ i.toString()+")").append('<td>' + nbr_list[i].geoip.bgp.country + '</td>');
        row.find("tr:eq("+ i.toString()+")").append('<td>' + nbr_list[i].geoip.czdb.country + ','+ nbr_list[i].geoip.czdb.area +'neighbour(s)</td>');
    }

    $('#neighbour_modal').modal();
}

function monitor_click(j){
    var monitor_list = table_list[j].monitor.split('|');
    var tbl = $("#monitor_table");
    tbl.find("tbody tr").remove();
    for (var i=0; i<monitor_list.length; i++) {
        var m = monitor_list[i];
        var row = tbl.find("tbody").append("<tr></tr>");
        
        if(monitor_json[m]){
            mon = monitor_json[m];
            var cc;
            var geo_list = mon.city.split(", ");
            cc = geo_list[geo_list.length-1].toLowerCase();
            row.find("tr:eq("+ i.toString()+")").append('<td>'+ (i).toString()+'</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td><span class="flag-icon flag-icon-' + cc + '"></span></td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>' + m + '</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>' + mon.activation + '</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>' + mon.city + '</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>' + mon.asn + '</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>' + mon.organization + '</td>');
        }
        else{
            row.find("tr:eq("+ i.toString()+")").append('<td>'+ (i).toString()+'</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td><span class="flag-icon flag-icon-un"></span></td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>*</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>*</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>*</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>*</td>');
            row.find("tr:eq("+ i.toString()+")").append('<td>*</td>');
        }
    }
    $('#monitor_modal').modal();
}

//add go function.
d3.select("#go_btn").on("click",go_click);

function go_click(){
    var value = $("#go_text").val();
    var reg = new RegExp("\\d+");
    if (!reg.test(value)){
        alert("wrong page format");
        return false;
    }
    if (parseInt(value) > num_page || parseInt(value) < 1){
        alert("page number out of range");
        return false;
    }

    active_page = parseInt(value) - 1;
    start_page = active_page;

    query_page();
}