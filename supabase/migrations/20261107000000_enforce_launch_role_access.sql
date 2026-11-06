begin;

-- Keep STAFF customer lookup available for checkout, but remove read access
-- granted only for deferred pages and finance workflows.
do $$
declare source_name text;
begin
  foreach source_name in array array[
    'workstations','wallet_ledger','content_items',
    'purchase_requests','settlement_requests'
  ] loop
    execute format('drop policy if exists staff_page_read on public.%I', source_name);
  end loop;
end $$;

-- Staff may read only their own transactions for checkout receipts.
-- Transaction writes must go through the role-checked SECURITY DEFINER RPCs.
drop policy if exists business_transactions_role_access on public.business_transactions;
drop policy if exists business_transactions_member_read on public.business_transactions;
drop policy if exists business_transactions_staff_own_read on public.business_transactions;
drop policy if exists business_transactions_manager_cashier_read on public.business_transactions;
create policy business_transactions_manager_cashier_read
  on public.business_transactions for select to authenticated
  using (public.user_has_business_role(business_id, array['OWNER','MANAGER','CASHIER']));
create policy business_transactions_staff_own_read
  on public.business_transactions for select to authenticated
  using (
    created_by = auth.uid()
    and public.user_has_business_role(business_id, array['STAFF'])
  );

-- NFC cards are managed by customer-facing roles; staff use the scoped
-- lookup/checkout RPCs rather than direct card-table access.
drop policy if exists nfc_cards_role_access on public.nfc_cards;
create policy nfc_cards_role_access on public.nfc_cards for all to authenticated
  using (public.user_has_business_role(business_id, array['OWNER','MANAGER','CASHIER']))
  with check (public.user_has_business_role(business_id, array['OWNER','MANAGER','CASHIER']));

-- Station sessions and audit logs are restricted to the roles that can open
-- their corresponding management pages.
drop policy if exists workstation_sessions_member_read on public.workstation_sessions;
create policy workstation_sessions_manager_read
  on public.workstation_sessions for select to authenticated
  using (public.user_has_business_role(business_id, array['OWNER','MANAGER']));

drop policy if exists business_access_logs_read on public.business_access_logs;
create policy business_access_logs_owner_read
  on public.business_access_logs for select to authenticated
  using (public.user_has_business_role(business_id, array['OWNER']));

drop policy if exists business_system_logs_read on public.business_system_logs;
create policy business_system_logs_owner_read
  on public.business_system_logs for select to authenticated
  using (public.user_has_business_role(business_id, array['OWNER']));

-- STAFF may process cash checkouts, but cannot spend or inspect stored
-- business/customer BuzzPoints through direct RPC calls.
create or replace function public.get_business_shared_bp(p_business_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null
    or not public.user_has_business_role(p_business_id,array['OWNER','MANAGER','CASHIER','STAFF']) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  return jsonb_build_object(
    'business_balance',
    case when public.user_has_business_role(p_business_id,array['OWNER','MANAGER','CASHIER'])
      then coalesce((select balance from public.business_bp_wallets where business_id=p_business_id),0)
      else null end,
    'customers',
    coalesce((select jsonb_agg(jsonb_build_object('id',c.id::text,'profile_status',p.status))
      from public.customers c left join public.profiles p on p.id=c.profile_id
      where c.business_id=p_business_id),'[]'::jsonb)
  );
end;
$$;
revoke all on function public.get_business_shared_bp(uuid) from public,anon;
grant execute on function public.get_business_shared_bp(uuid) to authenticated;

do $$
declare
  item record;
  function_id regprocedure;
  definition text;
begin
  for item in
    select * from (values
      (
        'public.purchase_shared_product(uuid,text,text,integer,uuid)',
        'if not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) then',
        'if not (public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) or public.user_has_business_role(p_business_id,array[''STAFF''])) then',
        'if not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'',''STAFF'']) then'
      ),
      (
        'public.checkout_product_purchase_before_rebates(uuid,text,integer,text,text,text,numeric,uuid)',
        'if not (public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) or (p_payment_method=''CASH'' and public.user_has_business_role(p_business_id,array[''STAFF'']))) then',
        'if not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) then',
        'if not (public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) or public.user_has_business_role(p_business_id,array[''STAFF''])) then'
      ),
      (
        'public.apply_business_shared_bp(uuid,text,text,numeric,uuid,uuid,jsonb)',
        'if not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) then',
        'if not (public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) or (p_kind=''PAYMENT'' and public.user_has_business_role(p_business_id,array[''STAFF'']))) then',
        'if not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'']) then'
      ),
      (
        'public.pay_business_customized_bp(uuid,text,numeric,uuid,jsonb)',
        'if not public.user_has_business_role(bid,array[''OWNER'',''MANAGER'',''CASHIER'']) then',
        'if not public.user_has_business_role(bid,array[''OWNER'',''MANAGER'',''CASHIER'',''STAFF'']) then',
        'if not (public.user_has_business_role(bid,array[''OWNER'',''MANAGER'',''CASHIER'']) or public.user_has_business_role(bid,array[''STAFF''])) then'
      ),
      (
        'payment_private.request_payment(uuid,text,text,text,text,integer,text,numeric,uuid)',
        'not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER''])',
        'not public.user_has_business_role(p_business_id,array[''OWNER'',''MANAGER'',''CASHIER'',''STAFF''])',
        null
      )
    ) as replacements(signature, new_guard, old_guard, alternate_old_guard)
  loop
    function_id := to_regprocedure(item.signature);
    if function_id is null then
      raise exception 'Required payment authorization function missing: %', item.signature;
    end if;
    select pg_get_functiondef(function_id) into definition;
    if strpos(definition, item.new_guard) > 0 then continue; end if;
    if strpos(definition, item.old_guard) > 0 then
      definition := replace(definition, item.old_guard, item.new_guard);
    elsif item.alternate_old_guard is not null
      and strpos(definition, item.alternate_old_guard) > 0 then
      definition := replace(definition, item.alternate_old_guard, item.new_guard);
    else
      raise exception 'Authorization definition differs for %. Review before applying', item.signature;
    end if;
    execute definition;
  end loop;
end $$;

drop policy if exists customized_wallet_read on public.business_customized_bp_wallets;
create policy customized_wallet_read
  on public.business_customized_bp_wallets for select to authenticated
  using (
    profile_id = auth.uid()
    or public.user_has_business_role(business_id, array['OWNER','MANAGER'])
  );
drop policy if exists customized_ledger_read on public.business_customized_bp_ledger;
create policy customized_ledger_read
  on public.business_customized_bp_ledger for select to authenticated
  using (
    profile_id = auth.uid()
    or public.user_has_business_role(business_id, array['OWNER','MANAGER'])
  );
drop policy if exists rebate_promotions_read on public.business_rebate_promotions;
create policy rebate_promotions_read
  on public.business_rebate_promotions for select to authenticated
  using (public.user_has_business_role(business_id, array['OWNER','MANAGER']));

notify pgrst, 'reload schema';
commit;
