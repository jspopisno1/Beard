<?php

require_once '../_basic/defs.php';

if (!Session::isLoggedIn()) {
    rsp('need_auth');
}

$act = getParams(array(
            '_action' => array('string', 'req'),
        ));
$act = $act['_action'];

$libC = new Categories(accessDB());
switch($act){
    case 'loadAll':
        rsp('success', $libC->loadAll());
        break;
    case 'remove':
        $v = getParams(array(
            'id' => array('numeric', 'req'),
        ));
        rsp('success', $libC->remove($v['id']));
        break;
}
