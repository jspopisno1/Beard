<?

$a = array(
    'test_json#top(a)' => array(
        '' => "[## log('test json' , a) #]",
        'test1->test1'=> 1,
        'test2->top:'=> "[## log('test 2') #]"
    )
);

echo json_encode($a);
exit;