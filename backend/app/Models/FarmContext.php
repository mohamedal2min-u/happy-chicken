<?php

namespace App\Models;

class FarmContext
{
    private static $farmId = null;

    /**
     * تحديد المدجنة الحالية للطلب البرمجي الحالي.
     */
    public static function setFarmId($id)
    {
        self::$farmId = $id;
    }

    /**
     * جلب المدجنة الحالية.
     */
    public static function getFarmId()
    {
        return self::$farmId;
    }

    /**
     * هل تم تحديد مدجنة؟
     */
    public static function hasFarmId()
    {
        return self::$farmId !== null;
    }
}
