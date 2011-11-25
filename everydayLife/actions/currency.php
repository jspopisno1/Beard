<?php

require_once '../_basic/defs.php';

if (!Session::isLoggedIn()) {
    rsp('need_auth');
}

$act = getParams(array(
            '_action' => array('string', 'req'),
        ));
$act = $act['_action'];

$libC = new Currencies(accessDB());
switch ($act) {
    case 'loadAll':
        rsp('success', $libC->loadAll());
        break;
    case 'loadMonth':
        $v = getParams(array(
            'month' => array('numeric', 'req'),
            'year' => array('numeric', 'req'),
        ));
        $month = $v['month'];
        $year = $v['year'];
        rsp('success', $libC->loadMonth($year, $month));
        break;
}
