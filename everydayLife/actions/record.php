<?php

require_once '../_basic/defs.php';

if (!Session::isLoggedIn()) {
    rsp('need_auth');
}

$act = getParams(array(
            '_action' => array('string', 'req'),
        ));
$act = $act['_action'];

$libR = new Records(accessDB());
switch ($act) {
    case 'loadMonths':
        $v = getParams(array(
                    'months' => array('json', 'req'),
                ));
        fl($v);
        $v0 = $v['months'][0];
        $v3 = $v['months'][3];
        $start = "$v0[year]-$v0[month]-1";
        $end = "$v3[year]-$v3[month]-1";
        $records = $libR->getRecords($start, $end);

        $rsp = array();
        for ($i = 0, $len = count($v['months']); $i < $len - 1; $i++) {
            $m = $v['months'][$i];
            $nextM = $v['months'][$i + 1];
            $end = strtotime("$nextM[year]-$nextM[month]-1");

            $rsp[] = array('month' => $m['month'], 'year' => $m['year'],
                'records' => array(), 'e' => $end, 'isCurr' => $i == 1);
        }

        foreach ($records as &$r) {
            $ts = strtotime($r['created_at']);
            for ($i = 0; $i < 3; $i++) {
                if ($ts < $rsp[$i]['e']) {
                    $r = partialArray($r,
                                    array(
                                        'id', 'amount_str' => 'amountStr',
                                        'amount',
                                        'rcurrency' => 'currency',
                                        'txt' => 'cate',
                                        'cid' => 'cateId',
                                        'record_type' => 'type',
                                        'descr',
                                        'cate_removed_at' => 'cateRemoved',
                                    ),
                                    array(
                                        'date' => date('j', $ts),
                                        'day' => date('D', $ts),
                                    )
                    );
                    $rsp[$i]['records'][] = &$r;
                    break;
                }
            }
        }

        l($rsp);
        rsp('success', $rsp);
        break; // end of load month's records

    case 'save':
        $v = getParams(array('records' => array('json', 'req')));
        $rsp = $libR->saveRecords($v['records']);
//        sleep(5);
        rsp('success', $rsp);
        break;
}
