<?PHP

// checks whether user exists or not
function exist($db, $user) {
    $sth = $db->prepare('SELECT count(*) FROM user WHERE user=:user');
    $sth->bindParam(':user', $user, PDO::PARAM_STR);
    $sth->execute();
    $count = $sth->fetchColumn();
    return $count != 0;
}

// open database connection
$db = new PDO('sqlite:userlist.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// is user table available?
$result = $db->query("SELECT name FROM sqlite_master WHERE type = 'table'");
$found = false;
foreach($result as $row)
    if ($row['name']== 'user')
        $found = true;

// create table user if not available
if ($found === false)
    $db->exec("CREATE TABLE user (user TEXT, pulse TEXT, detail TEXT);");

// update pulse user information (timestamp, rooms)
if(isset($_POST["user"]) && isset($_POST["pulse"]) && strlen(trim($_POST["user"])) > 0 && strlen(trim($_POST["pulse"])) > 0) {
    if (strlen($_POST["pulse"]) > 3145728) {
        header("HTTP/1.0 400 BAD REQUEST");
        die("pulse bigger than 3MB");
    }
    
    if (exist($db, $_POST["user"])) {
        $sth = $db->prepare('UPDATE user SET pulse=:pulse WHERE user=:user');
    } else {
        $sth = $db->prepare('INSERT INTO user (user, pulse) VALUES (:user, :pulse)');
    }
    $sth->bindParam(':user', $_POST["user"], PDO::PARAM_STR);
    $sth->bindParam(':pulse', $_POST["pulse"], PDO::PARAM_STR);
    $sth->execute();
    return;
}

// update detail user information (avatar, key, ip, port)
if(isset($_POST["user"]) && isset($_POST["detail"]) && strlen(trim($_POST["user"])) > 0 && strlen(trim($_POST["detail"]))> 0) {
    if (strlen($_POST["detail"]) > 3145728) {
        header("HTTP/1.0 400 BAD REQUEST");
        die("detail bigger than 3MB");
    }
    
    if (exist($db, $_POST["user"])) {
        $sth = $db->prepare('UPDATE user SET detail=:detail WHERE user=:user');
    } else {
        $sth = $db->prepare('INSERT INTO user (user, detail) VALUES (:user, :detail)');
    }
    $sth->bindParam(':user', $_POST["user"], PDO::PARAM_STR);
    $sth->bindParam(':detail', $_POST["detail"], PDO::PARAM_STR);
    $sth->execute();
    return;
}

// delete user
if(isset($_POST["user"]) && isset($_POST["delete"])) {
    $sth = $db->prepare('DELETE FROM user WHERE user=:user');
    $sth->bindParam(':user', $_POST["user"], PDO::PARAM_STR);
    $sth->execute();
    return;
}

// get detail user information (avatar, key, ip, port)
if(isset($_GET["user"]) && strlen(trim($_GET["user"]))) {
    $sth = $db->prepare("SELECT user, pulse, detail FROM user WHERE user = :user");
    $sth->bindParam(':user', $_GET["user"], PDO::PARAM_STR);
    $sth->execute();
    
    while($row = $sth->fetch()) {
        echo $row['detail'];
        return;
    }
    
    header("HTTP/1.0 404 NOT FOUND");
    return;
}

// otherwise send pulse user information
$sth = $db->prepare("SELECT user, pulse FROM user");
$sth->execute();
$users = array();
while($row = $sth->fetch())
    $users[] = $row['pulse'];

header('Content-type: application/json');
die(json_encode($users));
