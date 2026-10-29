<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HistoricalFlockTest extends TestCase
{
    use RefreshDatabase;

    private Farm $farm;

    protected function setUp(): void
    {
        parent::setUp();
        $this->farm = Farm::create(['name' => 'Test Farm', 'is_active' => true]);
        Sanctum::actingAs(User::factory()->create());
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'batch_number' => 'OLD-1',
            'start_date' => '2026-07-01',
            'end_date' => '2026-08-15',
            'start_count' => 2000,
            'chick_price' => 2.105,
            'mortality_count' => 50,
            'distribute_profit' => false,
            'expenses' => [
                ['category' => 'علف', 'amount' => 17690, 'description' => '29 × 610'],
                ['category' => 'لقاحات', 'amount' => 270],
            ],
            'sales' => [
                ['customer_name' => 'تاجر', 'count' => 1900, 'total_weight' => 6818, 'unit_price' => 6, 'total_amount' => 40908],
            ],
        ], $overrides);
    }

    public function test_historical_flock_records_everything_in_its_place(): void
    {
        $resp = $this->withHeader('X-Farm-ID', $this->farm->id)
            ->postJson('/api/flocks/historical', $this->payload());

        $resp->assertCreated()
            ->assertJsonPath('stats.sales', 40908)
            ->assertJsonPath('stats.expenses', 22170) // 4210 صيصان + 17690 + 270
            ->assertJsonPath('stats.net_profit', 18738);

        $flock = DB::table('flocks')->first();
        $this->assertSame('closed', $flock->status);
        $this->assertEquals(1, $flock->is_historical);
        $this->assertEquals(45, $flock->age_days);
        $this->assertEquals(50, $flock->current_count);

        $chicks = DB::table('expenses')
            ->join('expense_categories', 'expense_categories.id', '=', 'expenses.category_id')
            ->where('expense_categories.name', 'صيصان')->first();
        $this->assertEquals(4210, $chicks->amount);
        $this->assertSame('2026-07-01', $chicks->date);
        $this->assertSame(3, DB::table('expense_categories')->count());
    }

    public function test_historical_flock_allowed_while_another_flock_is_open(): void
    {
        $this->withHeader('X-Farm-ID', $this->farm->id)
            ->postJson('/api/flocks', ['batch_number' => 'NOW-1', 'start_count' => 1000, 'chick_price' => 2])
            ->assertCreated();

        $this->withHeader('X-Farm-ID', $this->farm->id)
            ->postJson('/api/flocks/historical', $this->payload())
            ->assertCreated();
    }

    public function test_new_flock_records_chick_price_as_expense(): void
    {
        $this->withHeader('X-Farm-ID', $this->farm->id)
            ->postJson('/api/flocks', ['batch_number' => 'NOW-1', 'start_count' => 1000, 'chick_price' => 2.1])
            ->assertCreated()
            ->assertJsonPath('chick_price', 2.1);

        $this->assertEquals(2100, DB::table('expenses')->value('amount'));
    }

    public function test_profit_is_distributed_to_partners_on_end_date(): void
    {
        foreach ([60, 40] as $i => $share) {
            $partnerId = DB::table('partners')->insertGetId(['name' => "P$i", 'created_at' => now(), 'updated_at' => now()]);
            DB::table('farm_partner_shares')->insert(['farm_id' => $this->farm->id, 'partner_id' => $partnerId, 'share_percentage' => $share, 'created_at' => now(), 'updated_at' => now()]);
        }

        $this->withHeader('X-Farm-ID', $this->farm->id)
            ->postJson('/api/flocks/historical', $this->payload(['distribute_profit' => true]))
            ->assertCreated();

        $rows = DB::table('partner_transactions')->orderBy('amount', 'desc')->get();
        $this->assertCount(2, $rows);
        $this->assertEquals(11242.8, $rows[0]->amount);
        $this->assertSame('profit_distribution', $rows[0]->type);
        $this->assertSame('2026-08-15', $rows[0]->date);
    }

    public function test_rejects_more_birds_than_started(): void
    {
        $this->withHeader('X-Farm-ID', $this->farm->id)
            ->postJson('/api/flocks/historical', $this->payload(['mortality_count' => 200]))
            ->assertStatus(422);
        $this->assertSame(0, DB::table('flocks')->count());
    }
}
