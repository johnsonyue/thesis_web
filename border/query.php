<?php 
	$config = parse_ini_file("config.ini");
	$servername = $config["servername"];
	$username = $config["username"];
	$password = $config["password"];
	$database = $config["database"];
	$data_dir = $config["data_dir"];

	if ( !empty($_POST["type"]) && !empty($_POST["date"]) ){
		$date = $_POST["date"];
		$type = $_POST["type"];
		$con = mysql_connect($servername, $username, $password);
		if (! $con){
			die('Could not connect:'.mysql_error());
		}
		mysql_select_db($database, $con);
		if ($type == "info") {
			$sql = "SELECT count(id) as num_node from "."".$date.""."_border_tbl";
			$result = mysql_query($sql);
			$count = -1;
			while( $row = mysql_fetch_array(($result)) ){
				$count = (int)$row["num_node"];
			}
			$res = array(
				"num_node" => $count
				);
			echo json_encode($res);
		}
		elseif ($type == "monitor"){
			echo exec("cat ".$data_dir."/caida_monitor.json");
		}
		elseif ($type == "page") {
			$sql = "";
			$start = $_POST["start"];
			$end = $_POST["end"];
			$num = $end-$start+1;
			$sql = "SELECT * from "."".$date.""."_border_tbl limit "."".$start."".","."".$num;
			//echo $sql."\n";
			$result = mysql_query($sql);
			$res = array();
			$foreign_neighbours = "";
			$sql_node_pfx = "SELECT node.id as id, node.addr as addr, node.monitor as monitor, geoip.geoip as geoip FROM "."".$date.""."_node_tbl as node, "."".$date.""."_geoip_tbl as geoip where node.id=geoip.id and node.id=";
			while ( $row = mysql_fetch_array($result) ){
				$id = $row["id"];
				$sql_node = $sql_node_pfx.$id;
				$node_result = mysql_query($sql_node);
				$node_row = mysql_fetch_array($node_result);

				$foreign_neighbours = $row["foreign_neighbours"];
				$list = explode("|", $foreign_neighbours);
				$foreign_neighbours_list = array();

				foreach($list as $nbr){
					$sql_nbr = $sql_node_pfx.$nbr;
					//echo $sql_node."\n";
					$nbr_result = mysql_query($sql_nbr);
					$nbr_row = mysql_fetch_array($nbr_result);
					$res_nbr = array(
						"id" => $nbr_row["id"],
						"addr" => $nbr_row["addr"],
						"monitor" => $nbr_row["monitor"],
						"geoip" => json_decode($nbr_row["geoip"])
						);
					array_push($foreign_neighbours_list, $res_nbr);
				}

				$res_node = array(
					"id" => $node_row["id"],
					"addr" => $node_row["addr"],
					"monitor" => $node_row["monitor"],
					"geoip" => json_decode($node_row["geoip"]),
					"neighbour" => $foreign_neighbours_list
					);

				array_push($res, $res_node);
			}
			echo json_encode(array("nodes" => $res));
		}
	}
?>